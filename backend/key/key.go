package key

import (
	"runtime"
	"strings"

	"github.com/samber/lo"
)

// KeyPosition represents the position of a key on a keyboard.
type KeyPosition struct {
	X, Y int
}

// Key represents a key on a keyboard.
type Key struct {
	// The platform specific code for the key. (VK_* on Windows, KEY_* on Linux)
	Code uint32
	// The name of the key.
	Name string
	// The platform to which the key code belongs.
	Platform string
}

// Equals returns true if the key codes are equal.
func (k Key) Equals(other Key) bool {
	return k.Code == other.Code
}

var keyCodeToPosition = map[uint32]*KeyPosition{
	// Row 0 - Function row (Y=0)
	Escape.Code:     {0, 0},
	F1.Code:         {1, 0},
	F2.Code:         {2, 0},
	F3.Code:         {3, 0},
	F4.Code:         {4, 0},
	F5.Code:         {5, 0},
	F6.Code:         {6, 0},
	F7.Code:         {7, 0},
	F8.Code:         {8, 0},
	F9.Code:         {9, 0},
	F10.Code:        {10, 0},
	F11.Code:        {11, 0},
	F12.Code:        {12, 0},
	ScrollLock.Code: {14, 0},
	// Row 1 - Number row (Y=1)
	Backtick.Code:       {0, 1},
	Number1.Code:        {1, 1},
	Number2.Code:        {2, 1},
	Number3.Code:        {3, 1},
	Number4.Code:        {4, 1},
	Number5.Code:        {5, 1},
	Number6.Code:        {6, 1},
	Number7.Code:        {7, 1},
	Number8.Code:        {8, 1},
	Number9.Code:        {9, 1},
	Number0.Code:        {10, 1},
	Minus.Code:          {11, 1},
	Plus.Code:           {12, 1},
	Backspace.Code:      {13, 1},
	Insert.Code:         {15, 1},
	Home.Code:           {16, 1},
	PageUp.Code:         {17, 1},
	NumLock.Code:        {18, 1},
	NumPadDivide.Code:   {19, 1},
	NumPadMultiply.Code: {20, 1},
	NumPadSubtract.Code: {21, 1},

	// Row 2 - QWERTY row (Y=2)
	Tab.Code:          {0, 2},
	Q.Code:            {1, 2},
	W.Code:            {2, 2},
	E.Code:            {3, 2},
	R.Code:            {4, 2},
	T.Code:            {5, 2},
	Y.Code:            {6, 2},
	U.Code:            {7, 2},
	I.Code:            {8, 2},
	O.Code:            {9, 2},
	P.Code:            {10, 2},
	LeftBracket.Code:  {11, 2},
	RightBracket.Code: {12, 2},
	Backslash.Code:    {13, 2},
	Delete.Code:       {15, 2},
	End.Code:          {16, 2},
	PageDown.Code:     {17, 2},
	NumPad7.Code:      {18, 2},
	NumPad8.Code:      {19, 2},
	NumPad9.Code:      {20, 2},
	NumPadAdd.Code:    {21, 2},

	// Row 3 - Home row (Y=3)
	CapsLock.Code:  {0, 3},
	A.Code:         {1, 3},
	S.Code:         {2, 3},
	D.Code:         {3, 3},
	F.Code:         {4, 3},
	G.Code:         {5, 3},
	H.Code:         {6, 3},
	J.Code:         {7, 3},
	K.Code:         {8, 3},
	L.Code:         {9, 3},
	SemiColon.Code: {10, 3},
	Quote.Code:     {11, 3},
	Enter.Code:     {12, 3},
	NumPad4.Code:   {18, 3},
	NumPad5.Code:   {19, 3},
	NumPad6.Code:   {20, 3},

	// Row 4 - Bottom letter row (Y=4)
	LeftShift.Code:  {0, 4},
	Z.Code:          {1, 4},
	X.Code:          {2, 4},
	C.Code:          {3, 4},
	V.Code:          {4, 4},
	B.Code:          {5, 4},
	N.Code:          {6, 4},
	M.Code:          {7, 4},
	Comma.Code:      {8, 4},
	Period.Code:     {9, 4},
	Slash.Code:      {10, 4},
	RightShift.Code: {11, 4},
	Up.Code:         {16, 4},
	NumPad1.Code:    {18, 4},
	NumPad2.Code:    {19, 4},
	NumPad3.Code:    {20, 4},

	// Row 5 - Modifier row (Y=5)
	LeftControl.Code:   {0, 5},
	LeftWin.Code:       {1, 5},
	LeftAlt.Code:       {2, 5},
	Space.Code:         {5, 5},
	RightAlt.Code:      {8, 5},
	RightWin.Code:      {9, 5},
	RightControl.Code:  {10, 5},
	Left.Code:          {15, 5},
	Down.Code:          {16, 5},
	Right.Code:         {17, 5},
	NumPad0.Code:       {18, 5},
	NumPadDecimal.Code: {20, 5},
}

// GetPosition returns the position of the key on the keyboard.
func (k Key) GetPosition() *KeyPosition {
	return keyCodeToPosition[k.Code]
}

var allKeyCodes = []Key{
	Backspace,
	Tab,
	Enter,
	Escape,
	Space,
	PageUp,
	PageDown,
	End,
	Home,
	Left,
	Up,
	Right,
	Down,
	Insert,
	Delete,
	Number0,
	Number1,
	Number2,
	Number3,
	Number4,
	Number5,
	Number6,
	Number7,
	Number8,
	Number9,
	A,
	B,
	C,
	D,
	E,
	F,
	G,
	H,
	I,
	J,
	K,
	L,
	M,
	N,
	O,
	P,
	Q,
	R,
	S,
	T,
	U,
	V,
	W,
	X,
	Y,
	Z,
	LeftWin,
	RightWin,
	NumPad0,
	NumPad1,
	NumPad2,
	NumPad3,
	NumPad4,
	NumPad5,
	NumPad6,
	NumPad7,
	NumPad8,
	NumPad9,
	NumPadMultiply,
	NumPadAdd,
	NumPadSubtract,
	NumPadDecimal,
	NumPadDivide,
	F1,
	F2,
	F3,
	F4,
	F5,
	F6,
	F7,
	F8,
	F9,
	F10,
	F11,
	F12,
	F13,
	F14,
	F15,
	F16,
	F17,
	F18,
	F19,
	F20,
	F21,
	F22,
	F23,
	F24,
	NumLock,
	ScrollLock,
	PrintScreen,
	Pause,
	LeftShift,
	RightShift,
	LeftControl,
	RightControl,
	LeftAlt,
	RightAlt,
	Backtick,
	LeftBracket,
	RightBracket,
	Backslash,
	SemiColon,
	CapsLock,
	Plus,
	Comma,
	Minus,
	Period,
	Slash,
	Quote,
}

var modifierKeys = []Key{
	LeftControl,
	RightControl,
	LeftAlt,
	RightAlt,
	LeftWin,
	RightWin,
}

// RegisterModifierKey registers a new modifier key.
func AddModifierKey(key Key) {
	modifierKeys = append(modifierKeys, key)
}

// RemoveModifierKey removes a modifier key.
func RemoveModifierKey(key Key) {
	modifierKeys = lo.Filter(modifierKeys, func(k Key, _ int) bool {
		return k.Code != key.Code
	})
}

// ListModifierKeys returns a list of all modifier keys.
func ListModifierKeys() []Key {
	return modifierKeys
}

// IsModifierKey returns true if the key is a modifier key.
func IsModifierKey(key Key) bool {
	return lo.Contains(lo.Map(modifierKeys, func(k Key, _ int) uint32 { return k.Code }), key.Code)
}

// FindKeyCode returns a Key based on the platform specific code. If the key is
// not found, it returns a Key with the provided code and no name.
func FindKeyCode(val uint32) Key {
	for _, code := range allKeyCodes {
		if code.Code == val {
			return code
		}
	}

	return Key{val, "", runtime.GOOS}
}

// FindKey returns a Key based on the name and a bool indicating if the key was found.
func FindKey(val string) (Key, bool) {
	for _, code := range allKeyCodes {
		if strings.EqualFold(code.Name, val) {
			return code, true
		}
	}

	return Key{}, false
}

// PanValueForKeyPosition returns the pan value for a given key position and maximum X value. The pan value is a float
// between -1.0 and 1.0, where -1.0 is left and 1.0 is right. The key position is the position of the key on the
// keyboard, and the maximum X value is the maximum number of contiguous horizontal keys in the keyboard.
func PanValueForKeyPosition(kp KeyPosition, maxX int) float64 {
	return float64(kp.X+1)/float64(maxX)*2 - 1
}
