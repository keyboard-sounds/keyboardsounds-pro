//go:build darwin

package oskhelpers

/*
#cgo CFLAGS: -x objective-c -fobjc-arc -fblocks
#cgo LDFLAGS: -framework AppKit -framework CoreGraphics -framework Foundation

#import <AppKit/AppKit.h>
#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <dispatch/dispatch.h>
#import <math.h>
#import <string.h>

extern void oskReadyCallback(void);
extern void oskForceDismissCallback(void);

static NSPanel *g_panel = nil;
static NSView *g_contentView = nil;
static NSTextField *g_textField = nil;
static NSButton *g_closeButton = nil;
static char *g_textCopy = NULL;
static int g_fontSize = 28;
static CGFloat g_fontR = 1, g_fontG = 1, g_fontB = 1;
static CGFloat g_bgR = 0.12, g_bgG = 0.12, g_bgB = 0.12, g_bgAlpha = 0.86;
static int g_cornerRadius = 8;
static int g_positionBottom = 1;
static int g_offset = 50;
static int g_monitorIndex = 0;
static int g_windowWidth = 400;
static int g_windowHeight = 60;

@interface OSKOverlayView : NSView
@end
@implementation OSKOverlayView
- (void)drawRect:(NSRect)dirtyRect {
	NSRect bounds = [self bounds];
	CGFloat radius = (CGFloat)g_cornerRadius;
	if (radius > 0) {
		NSBezierPath *path = [NSBezierPath bezierPathWithRoundedRect:bounds xRadius:radius yRadius:radius];
		[path addClip];
	}
	[[NSColor colorWithRed:g_bgR green:g_bgG blue:g_bgB alpha:g_bgAlpha] setFill];
	NSRectFill(bounds);
}
@end

static void updatePanelContent(void) {
	if (!g_panel || !g_contentView || !g_textField) return;
	NSString *str = g_textCopy ? [NSString stringWithUTF8String:g_textCopy] : @"";
	[g_textField setStringValue:str];
	NSFont *font = [NSFont systemFontOfSize:(CGFloat)g_fontSize weight:NSFontWeightMedium];
	[g_textField setFont:font];
	[g_textField setTextColor:[NSColor colorWithRed:g_fontR green:g_fontG blue:g_fontB alpha:1.0]];
	[g_contentView setNeedsDisplay:YES];
}

static void positionPanel(void) {
	if (!g_panel) return;
	NSArray *screens = [NSScreen screens];
	if ([screens count] == 0) return;
	int idx = g_monitorIndex;
	if (idx < 0) idx = 0;
	if (idx >= (int)[screens count]) idx = (int)[screens count] - 1;
	NSScreen *screen = screens[idx];
	NSRect frame = [screen visibleFrame];
	CGFloat x = NSMinX(frame) + (NSWidth(frame) - (CGFloat)g_windowWidth) / 2.0;
	CGFloat y;
	if (g_positionBottom) {
		y = NSMinY(frame) + (CGFloat)g_offset;
	} else {
		y = NSMaxY(frame) - (CGFloat)g_windowHeight - (CGFloat)g_offset;
	}
	[g_panel setFrameOrigin:NSMakePoint(x, y)];
	[g_panel setContentSize:NSMakeSize((CGFloat)g_windowWidth, (CGFloat)g_windowHeight)];
}

@interface OSKCloseTarget : NSObject
@end
@implementation OSKCloseTarget
- (void)closeClicked:(id)sender {
	(void)sender;
	oskForceDismissCallback();
}
@end

static OSKCloseTarget *g_closeTarget = nil;

void darwin_osk_create(void) {
	if (g_panel != nil) {
		oskReadyCallback();
		return;
	}
	[NSApplication sharedApplication];
	[NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];

	NSRect contentRect = NSMakeRect(0, 0, (CGFloat)g_windowWidth, (CGFloat)g_windowHeight);
	NSUInteger styleMask = NSWindowStyleMaskBorderless;
	g_panel = [[NSPanel alloc] initWithContentRect:contentRect
	                                     styleMask:styleMask
	                                       backing:NSBackingStoreBuffered
	                                         defer:NO];
	[g_panel setLevel:(NSWindowLevel)kCGMaximumWindowLevel];
	[g_panel setOpaque:NO];
	[g_panel setBackgroundColor:[NSColor clearColor]];
	[g_panel setHasShadow:YES];
	[g_panel setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces | NSWindowCollectionBehaviorFullScreenAuxiliary];

	g_contentView = [[OSKOverlayView alloc] initWithFrame:contentRect];
	[g_contentView setWantsLayer:YES];
	[g_contentView.layer setCornerRadius:(CGFloat)g_cornerRadius];
	[g_contentView.layer setMasksToBounds:YES];
	[g_panel setContentView:g_contentView];

	g_textField = [[NSTextField alloc] initWithFrame:NSInsetRect(contentRect, 44, 12)];
	[g_textField setBezeled:NO];
	[g_textField setDrawsBackground:NO];
	[g_textField setEditable:NO];
	[g_textField setSelectable:NO];
	[g_textField setAlignment:NSTextAlignmentCenter];
	[g_textField setFont:[NSFont systemFontOfSize:(CGFloat)g_fontSize weight:NSFontWeightMedium]];
	[g_contentView addSubview:g_textField];

	CGFloat btnSize = 24;
	NSRect closeRect = NSMakeRect(NSWidth(contentRect) - btnSize - 8, NSHeight(contentRect) - btnSize - 8, btnSize, btnSize);
	g_closeButton = [[NSButton alloc] initWithFrame:closeRect];
	[g_closeButton setButtonType:NSButtonTypeMomentaryPushIn];
	[g_closeButton setBezelStyle:NSBezelStyleRegularSquare];
	[g_closeButton setTitle:@"✕"];
	g_closeTarget = [[OSKCloseTarget alloc] init];
	[g_closeButton setTarget:g_closeTarget];
	[g_closeButton setAction:@selector(closeClicked:)];
	[g_contentView addSubview:g_closeButton];

	oskReadyCallback();
}

void darwin_osk_run(void) {
	[NSApp run];
}

typedef struct {
	const char *text;
	int fontSize;
	double fontR, fontG, fontB;
	double bgR, bgG, bgB, bgAlpha;
	int cornerRadius;
	int positionBottom;
	int offset;
	int monitorIndex;
	int width;
	int height;
} OSKConfig;

static void doShow(OSKConfig *cfg) {
	if (!g_panel) return;
	if (g_textCopy) {
		free(g_textCopy);
		g_textCopy = NULL;
	}
	if (cfg->text) {
		g_textCopy = strdup(cfg->text);
	}
	g_fontSize = cfg->fontSize > 0 ? cfg->fontSize : 28;
	g_fontR = (CGFloat)cfg->fontR;
	g_fontG = (CGFloat)cfg->fontG;
	g_fontB = (CGFloat)cfg->fontB;
	g_bgR = (CGFloat)cfg->bgR;
	g_bgG = (CGFloat)cfg->bgG;
	g_bgB = (CGFloat)cfg->bgB;
	g_bgAlpha = (CGFloat)cfg->bgAlpha;
	g_cornerRadius = cfg->cornerRadius >= 0 ? cfg->cornerRadius : 8;
	g_positionBottom = cfg->positionBottom;
	g_offset = cfg->offset >= 0 ? cfg->offset : 50;
	g_monitorIndex = cfg->monitorIndex;

	// Measure text to size the panel (match Windows behavior: size to content + padding)
	const CGFloat hPadding = 16.0;
	const CGFloat vPadding = 16.0;
	const CGFloat closeArea = 40.0;
	CGFloat textW = 300.0, textH = (CGFloat)g_fontSize;
	if (g_textCopy && strlen(g_textCopy) > 0) {
		NSString *str = [NSString stringWithUTF8String:g_textCopy];
		NSFont *font = [NSFont systemFontOfSize:(CGFloat)g_fontSize weight:NSFontWeightMedium];
		NSDictionary *attrs = @{ NSFontAttributeName: font };
		NSSize size = [str sizeWithAttributes:attrs];
		textW = size.width;
		textH = size.height;
	}
	g_windowWidth = (int)ceil(textW) + (int)(hPadding * 2) + (int)closeArea;
	g_windowHeight = (int)ceil(textH) + (int)(vPadding * 2);
	if (g_windowWidth < 100) g_windowWidth = 100;
	if (g_windowHeight < 40) g_windowHeight = 40;

	// Resize content view, text field, and close button to new dimensions
	NSRect contentRect = NSMakeRect(0, 0, (CGFloat)g_windowWidth, (CGFloat)g_windowHeight);
	[g_contentView setFrame:contentRect];
	[g_contentView setNeedsDisplay:YES];
	// Text field: inset for close button (right) and padding; use same insets as creation
	[g_textField setFrame:NSInsetRect(contentRect, 44, 12)];
	CGFloat btnSize = 24;
	NSRect closeRect = NSMakeRect(NSWidth(contentRect) - btnSize - 8, NSHeight(contentRect) - btnSize - 8, btnSize, btnSize);
	[g_closeButton setFrame:closeRect];

	updatePanelContent();
	positionPanel();
	[g_panel orderFrontRegardless];
}

void darwin_osk_show(const char *text, int fontSize, double fontR, double fontG, double fontB,
                     double bgR, double bgG, double bgB, double bgAlpha, int cornerRadius,
                     int positionBottom, int offset, int monitorIndex, int width, int height) {
	OSKConfig cfg = {
		.text = text,
		.fontSize = fontSize,
		.fontR = fontR, .fontG = fontG, .fontB = fontB,
		.bgR = bgR, .bgG = bgG, .bgB = bgB, .bgAlpha = bgAlpha,
		.cornerRadius = cornerRadius,
		.positionBottom = positionBottom,
		.offset = offset,
		.monitorIndex = monitorIndex,
		.width = width,
		.height = height,
	};
	OSKConfig *cfgCopy = (OSKConfig *)malloc(sizeof(OSKConfig));
	*cfgCopy = cfg;
	if (cfgCopy->text) cfgCopy->text = strdup(text);
	dispatch_async(dispatch_get_main_queue(), ^{
		doShow(cfgCopy);
		if (cfgCopy->text) free((void *)cfgCopy->text);
		free(cfgCopy);
	});
}

void darwin_osk_hide(void) {
	dispatch_async(dispatch_get_main_queue(), ^{
		if (g_panel) [g_panel orderOut:nil];
	});
}

void darwin_osk_force_dismiss(void) {
	dispatch_async(dispatch_get_main_queue(), ^{
		if (g_panel) [g_panel orderOut:nil];
	});
}
*/
import "C"
