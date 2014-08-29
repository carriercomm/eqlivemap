#include <ButtonConstants.au3>
#include <StringConstants.au3>
#include <EditConstants.au3>
#include <GUIConstantsEx.au3>
#include <StaticConstants.au3>
#include <WindowsConstants.au3>
#include <MsgBoxConstants.au3>
#include <File.au3>
#include <FileConstants.au3>
#include <IE.au3>

Global $logDirs[1]
Global $playerId = ""
Global $logDirectory = ""
Global $url = "http://eqlivemap.meteor.com"
Global $lastline = ""
Global $active = 0

Opt("GUIOnEventMode", 1)

$main = GUICreate("EQ Live Map", 254, 347, -1, -1)
GUISetIcon("eqicon.ico", -1)
GUISetBkColor(0xFFFFFF)
$PlayerIdInput = GUICtrlCreateInput("", 8, 136, 241, 28)
GUICtrlSetFont(-1, 12, 400, 0, "MS Sans Serif")
$LogDirectoryInput =  GUICtrlCreateInput("", 8, 208, 193, 28, BitOR($GUI_SS_DEFAULT_INPUT,$ES_READONLY))
GUICtrlSetFont(-1, 10, 400, 0, "MS Sans Serif")
$Pick = GUICtrlCreateButton("Pick", 200, 208, 49, 30, $WS_CLIPSIBLINGS)
GUICtrlSetOnEvent(-1, "PickDirectory")
$Go = GUICtrlCreateButton("GO", 16, 272, 225, 41)
GUICtrlSetOnEvent(-1, "ToggleMapping")
$Pic1 = GUICtrlCreatePic("everquest-logo.gif", 0, 0, 252, 92)
GUICtrlSetOnEvent(-1, "Help")
$Label1 = GUICtrlCreateLabel("Player Key", 8, 104, 77, 24)
GUICtrlSetFont(-1, 12, 400, 0, "MS Sans Serif")
$Label2 = GUICtrlCreateLabel("EQ Log Directory", 8, 176, 125, 24)
GUICtrlSetFont(-1, 12, 400, 0, "MS Sans Serif")
$help = GUICtrlCreateIcon("C:\Windows\System32\imageres.dll", -95, 88, 106, 16, 16)
GUICtrlSetOnEvent(-1, "Help")
$status = GUICtrlCreateLabel("", 8, 320, 245, 20)
GUICtrlSetColor(-1, 0x0000FF)
GUISetState(@SW_SHOW)
GUISetOnEvent($GUI_EVENT_CLOSE, "quit")

LoadData()

While 1
	Sleep(100)
WEnd

Func Help()
   ; MsgBox($MB_SYSTEMMODAL, "", "Visit " & $url & " for instructions on how to use EQ Live Map.")
   ShellExecute( $url )
EndFunc


Func PickDirectory()
 ; Create a constant variable in Local scope of the message to display in FileSelectFolder.
    Local Const $sMessage = "Select Everquest log directory"

    ; Display an open dialog to select a file.
    Local $sFileSelectFolder = FileSelectFolder($sMessage, "C:\")
    If @error Then
        ; Display the error message.
        ;MsgBox($MB_SYSTEMMODAL, "", "No folder was selected.")
    Else
        ; Display the selected folder.
		GUICtrlSetData($LogDirectoryInput, $sFileSelectFolder)
        ;MsgBox($MB_SYSTEMMODAL, "", "You chose the following folder:" & @CRLF & $sFileSelectFolder)
    EndIf
EndFunc

Func ToggleMapping()
   If $active == 0 Then
	  $start = StartMapping()
	  If $start <> 1 Then
		 MsgBox($MB_SYSTEMMODAL, "", $start)
		 Return
	  EndIf
	  $active = 1
	  GUICtrlSetData($Go, "STOP")
	  SaveData()
   Else
	  StopMapping()
	  $active = 0
	  GUICtrlSetData($Go, "GO")

   EndIf
EndFunc

Func StopMapping()
    _MonitorDirectory()
   Return 1
EndFunc

Func StartMapping()
   $playerId =  StringStripWS(GUICtrlRead($PlayerIdInput), $STR_STRIPLEADING + $STR_STRIPTRAILING)
   $logDirectory =  GUICtrlRead($LogDirectoryInput)
   If FileExists($logDirectory) == 0 Then
	  Return "Please select your Everquest Log Directory"
   EndIf
   If StringLen($playerId) <> 17 Then
	  Return "Please supply a valid player id from " & $url & "."
   EndIf
   $logDirs[0] = $logDirectory
   _MonitorDirectory($logDirs, True, 100, "_ParseLogs")
   Return 1
EndFunc

Func SaveData()
   RegWrite("HKEY_CURRENT_USER\Software\EQLiveMap", "PlayerId", "REG_SZ", StringStripWS(GUICtrlRead($PlayerIdInput), $STR_STRIPLEADING + $STR_STRIPTRAILING))
   RegWrite("HKEY_CURRENT_USER\Software\EQLiveMap", "LogFolder", "REG_SZ", GUICtrlRead($LogDirectoryInput))
EndFunc

Func LoadData()
   GUICtrlSetData($PlayerIdInput,RegRead("HKEY_CURRENT_USER\Software\EQLiveMap", "PlayerId"))
   GUICtrlSetData($LogDirectoryInput,RegRead("HKEY_CURRENT_USER\Software\EQLiveMap", "LogFolder"))
EndFunc

Func Quit()
   StopMapping()
   Exit
EndFunc

;This function is called when a file in the directory we are monitoring changes
;We simply read the last line of that file and see if it's of interest to us
;If so, fire off an http request to the server to update the player positon
Func _ParseLogs($Action, $FilePath)

   ;debug file gets updated a lot, ignore it
   If StringInStr($FilePath, "dbg.txt") <> 0 Then
	  Return False
   EndIf

   ;read player name from file
   Local $playerFile = StringRegExp( $FilePath, "eqlog_([^_]+)",1)
   Local $playerName
   If IsArray($playerFile) Then
	  $playerName = $playerFile[0]
   EndIf


   ;open log file that changed and read last line
   Local $hFileOpen = FileOpen($FilePath)
   If $hFileOpen = -1 Then
	 Return False
   EndIf
   Local $data = FileReadLine($hFileOpen, -1)
   FileClose($hFileOpen)

   ;if we got the same line twice, just ignore
   ;happens when eq writes a lot of text to the log between the file polling period
   If StringCompare($data, $lastline) == 0 Then
	  Return False
   EndIf
   ;store the line
   $lastline = $data

   ConsoleWrite($data  & @CRLF)
   ;check for current location from a /loc
   Local $location = StringRegExp( $data, "Your Location is ([^,]+), ([^,]+), (.+)", 1)
   If IsArray($location) Then
	  ;send location update request to mapping server
	  GUICtrlSetData($status, "Setting " & $playerName & " location to " & $location[0] & "," & $location[1] & "," & $location[2] & ".")
	  $oXmlHttp = ObjCreate("Microsoft.XMLHTTP")
	  $fullUrl = $url&"/player/setloc?player=" & $playerId & "&x=" & $location[1] &  "&y=" & $location[0] & "&z=" & $location[2] &"&name=" & $playerName
	  $oXmlHttp.Open("GET", $fullUrl , False)
	  $oXmlHttp.Send()
	  ConsoleWrite($fullUrl & @CRLF)
   EndIf

   ;check for zone switch by zonging
   Local $zone = StringRegExp( $data, "You have entered ([^\.]+)\.", 1)
   ;check for zone switch from /who or /
   Local $zoneWho = StringRegExp( $data, "There are \d+ players in ([^\.]+)\.", 1)
   If IsArray($zone) Or IsArray($zoneWho) Then
	  ;send map update request to mapping server
	  If IsArray($zone) Then
		 $map = $zone[0]
	  EndIf
	  If IsArray($zoneWho) Then
		 $map = $zoneWho[0]
	  EndIf
	  Local $fullUrl =  $url&"/player/setmap?player=" & $playerId & "&map=" & $map &"&name=" & $playerName
	  GUICtrlSetData($status, "Setting " & $playerName & " map to " & $map & ".")
	  $oXmlHttp = ObjCreate("Microsoft.XMLHTTP")
	  $oXmlHttp.Open("GET",$fullUrl, False)
	  $oXmlHttp.Send()
	  ConsoleWrite($fullUrl & @CRLF)
   EndIf

EndFunc







;~ =========================== FUNCTION _MonitorDirectory() ==============================
#cs
    Description:     Monitors the user defined directories for file activity.
    Original:        http://www.autoitscript.com/forum/index.php?showtopic=69044&hl=folderspy&st=0
    Modified:        Jack Chen
    Syntax:         _MonitorDirectory($Dirs = "", $Subtree = True, $TimerMs = 250, $Function = "_ReportChanges")
    Parameters:
                    $Dirs          - Optional: Zero-based array of valid directories to be monitored.
                    $Subtree       - Optional: Subtrees will be monitored if $Subtree = True.
                    $TimerMs       - Optional: Timer to register changes in milliseconds.
                    $Function      - Optional: Function to launch when changes are registered. e.g. _ReportChanges
                    Syntax of your function must be e.g._ReportChanges($Action, $FilePath)
                    Possible actions: Created, Deleted, Modified, Rename-, Rename+, Unknown
    Remarks:        Call _MonitorDirectory() without parameters to stop monitoring all directories.
                    THIS SHOULD BE DONE BEFORE EXITING SCRIPT AT LEAST.
#ce

Func _MonitorDirectory($Dirs = "", $Subtree = True, $TimerMs = 250, $Function = "_ReportChanges")

    Local Static $nMax, $hBuffer, $hEvents, $aSubtree, $sFunction
    If IsArray($Dirs) Then
        $nMax = UBound($Dirs)
    ElseIf $nMax < 1 Then
        Return
	 EndIf

    Local Static $aDirHandles[$nMax], $aOverlapped[$nMax], $aDirs[$nMax]
    If IsArray($Dirs) Then
        $aDirs = $Dirs
        $aSubtree = $Subtree
        $sFunction = $Function
;~      $hBuffer = DllStructCreate("byte[4096]")
        $hBuffer = DllStructCreate("byte[65536]")
        For $i = 0 To $nMax - 1
            If StringRight($aDirs[$i], 1) <> "\" Then $aDirs[$i] &= "\"
;~  http://msdn.microsoft.com/en-us/library/aa363858%28VS.85%29.aspx
            $aResult = DllCall("kernel32.dll", "hwnd", "CreateFile", "Str", $aDirs[$i], "Int", 0x1, "Int", BitOR(0x1, 0x4, 0x2), "ptr", 0, "int", 0x3, "int", BitOR(0x2000000, 0x40000000), "int", 0)
			$aDirHandles[$i] = $aResult[0]
            $aOverlapped[$i] = DllStructCreate("ulong_ptr Internal;ulong_ptr InternalHigh;dword Offset;dword OffsetHigh;handle hEvent")
            For $j = 1 To 5
                DllStructSetData($aOverlapped, $j, 0)
            Next
            _SetReadDirectory($aDirHandles[$i], $hBuffer, $aOverlapped[$i], True, $aSubtree)
        Next
        $hEvents = DllStructCreate("hwnd hEvent[" & UBound($aOverlapped) & "]")
        For $j = 1 To UBound($aOverlapped)
            DllStructSetData($hEvents, "hEvent", DllStructGetData($aOverlapped[$j - 1], "hEvent"), $j)
        Next
        AdlibRegister("_GetChanges", $TimerMs)
    ElseIf $Dirs = "ReadDirChanges" Then
        _GetDirectoryChanges($aDirHandles, $hBuffer, $aOverlapped, $hEvents, $aDirs, $aSubtree, $sFunction)
    ElseIf $Dirs = "" Then
        AdlibUnRegister("_GetChanges")
;~  Close Handle
        For $i = 0 To $nMax - 1
            DllCall("kernel32.dll", "bool", "CloseHandle", "handle", $aDirHandles[$i])
            DllCall("kernel32.dll", "bool", "CloseHandle", "handle", $aOverlapped[$i])
        Next
        DllCall("kernel32.dll", "bool", "CloseHandle", "handle", $hEvents)
		;clearing out these variables like this makes it impossible to stop and restart monitoring
        ;$nMax = 0
        ;$hBuffer = ""
        ;$hEvents = ""
        ;$aDirHandles = ""
        ;$aOverlapped = ""
        ;$aDirs = ""
        ;$aSubtree = ""
        ;$sFunction = ""
    EndIf
EndFunc   ;==>_MonitorDirectory

Func _SetReadDirectory($hDir, $hBuffer, $hOverlapped, $bInitial, $bSubtree)
    Local $hEvent, $pBuffer, $nBufferLength, $pOverlapped
    $pBuffer = DllStructGetPtr($hBuffer)
    $nBufferLength = DllStructGetSize($hBuffer)
    $pOverlapped = DllStructGetPtr($hOverlapped)
    If $bInitial Then
        $hEvent = DllCall("kernel32.dll", "hwnd", "CreateEvent", "UInt", 0, "Int", True, "Int", False, "UInt", 0)
        DllStructSetData($hOverlapped, "hEvent", $hEvent[0])
    EndIf
;~  http://msdn.microsoft.com/en-us/library/aa365465%28VS.85%29.aspx
    $aResult = DllCall("kernel32.dll", "Int", "ReadDirectoryChangesW", "hwnd", $hDir, "ptr", $pBuffer, "dword", $nBufferLength, "int", $bSubtree, "dword", BitOR(0x1, 0x2, 0x4, 0x8, 0x10, 0x40, 0x100), "Uint", 0, "Uint", $pOverlapped, "Uint", 0)
    Return $aResult[0]
EndFunc   ;==>_SetReadDirectory

Func _GetChanges()
    _MonitorDirectory("ReadDirChanges")
EndFunc   ;==>_GetChanges

Func _GetDirectoryChanges($aDirHandles, $hBuffer, $aOverlapped, $hEvents, $aDirs, $aSubtree, $sFunction)
    Local $aMsg, $i, $nBytes = 0
    $aMsg = DllCall("User32.dll", "dword", "MsgWaitForMultipleObjectsEx", "dword", UBound($aOverlapped), "ptr", DllStructGetPtr($hEvents), "dword", -1, "dword", 0x4FF, "dword", 0x6)
    $i = $aMsg[0]
    Switch $i
        Case 0 To UBound($aDirHandles) - 1
            DllCall("Kernel32.dll", "Uint", "ResetEvent", "uint", DllStructGetData($aOverlapped[$i], "hEvent"))
            _ParseFileMessages($hBuffer, $aDirs[$i], $sFunction)
            _SetReadDirectory($aDirHandles[$i], $hBuffer, $aOverlapped[$i], False, $aSubtree)
            Return $nBytes
    EndSwitch
    Return 0
EndFunc   ;==>_GetDirectoryChanges

Func _ParseFileMessages($hBuffer, $sDir, $sFunction)
    Local $hFileNameInfo, $pBuffer, $FilePath
    Local $nFileNameInfoOffset = 12, $nOffset = 0, $nNext = 1
    $pBuffer = DllStructGetPtr($hBuffer)
    While $nNext <> 0
        $hFileNameInfo = DllStructCreate("dword NextEntryOffset;dword Action;dword FileNameLength", $pBuffer + $nOffset)
        $hFileName = DllStructCreate("wchar FileName[" & DllStructGetData($hFileNameInfo, "FileNameLength") / 2 & "]", $pBuffer + $nOffset + $nFileNameInfoOffset)
        Switch DllStructGetData($hFileNameInfo, "Action")
            Case 0x1 ; $FILE_ACTION_ADDED
                $Action = "Created"
            Case 0x2 ; $FILE_ACTION_REMOVED
                $Action = "Deleted"
            Case 0x3 ; $FILE_ACTION_MODIFIED
                $Action = "Modified"
            Case 0x4 ; $FILE_ACTION_RENAMED_OLD_NAME
                $Action = "Rename-"
            Case 0x5 ; $FILE_ACTION_RENAMED_NEW_NAME
                $Action = "Rename+"
            Case Else
                $Action = "Unknown"
        EndSwitch

        $FilePath = $sDir & DllStructGetData($hFileName, "FileName")
        Call($sFunction, $Action, $FilePath) ; Launch the specified function
        $nNext = DllStructGetData($hFileNameInfo, "NextEntryOffset")
        $nOffset += $nNext
    WEnd
EndFunc   ;==>_ParseFileMessages
;~ ===========================End of FUNCTION _MonitorDirectory() ==============================
