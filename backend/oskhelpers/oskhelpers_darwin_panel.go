//go:build darwin

package oskhelpers

/*
#cgo CFLAGS: -x objective-c -fobjc-arc -fblocks
#cgo LDFLAGS: -framework AppKit -framework CoreGraphics -framework CoreFoundation -framework Foundation

#import <AppKit/AppKit.h>
#import <CoreFoundation/CoreFoundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <dispatch/dispatch.h>
#import <math.h>
#import <string.h>

extern void oskForceDismissCallback(void);
extern void oskClickShowAppCallback(void);
extern size_t darwin_osk_get_next_show_text(char *buf, size_t bufSize);

static NSPanel *g_panel = nil;
static NSView *g_contentView = nil;
static NSTextField *g_textField = nil;
static NSView *g_closeButtonView = nil;
static char *g_textCopy = NULL;
static size_t g_textCopyLen = 0;
static int g_fontSize = 28;
static CGFloat g_fontR = 1, g_fontG = 1, g_fontB = 1;
static CGFloat g_bgR = 0.12, g_bgG = 0.12, g_bgB = 0.12, g_bgAlpha = 0.86;
static int g_cornerRadius = 8;
static int g_positionBottom = 1;
static int g_offset = 50;
static int g_monitorIndex = 0;
static int g_windowWidth = 400;
static int g_windowHeight = 60;
static int g_clickShowsApp = 0;

void darwin_osk_set_click_shows_app(int v) {
	g_clickShowsApp = v ? 1 : 0;
}

@interface OSKOverlayView : NSView
@end
@implementation OSKOverlayView
- (BOOL)acceptsFirstMouse:(NSEvent *)event {
	(void)event;
	return YES;
}
- (void)mouseDown:(NSEvent *)event {
	(void)event;
	if (g_clickShowsApp) {
		oskClickShowAppCallback();
	}
	[super mouseDown:event];
}
- (void)drawRect:(NSRect)dirtyRect {
	NSRect bounds = [self bounds];
	CGFloat radius = (CGFloat)g_cornerRadius;
	if (radius > 0) {
		NSBezierPath *path = [NSBezierPath bezierPathWithRoundedRect:bounds xRadius:radius yRadius:radius];
		[path addClip];
	}
	[[NSColor colorWithRed:g_bgR green:g_bgG blue:g_bgB alpha:g_bgAlpha] setFill];
	NSRectFill(bounds);
	// Draw text from g_textCopy directly (bypass NSTextField to avoid any cell/truncation behavior).
	if (g_textCopy && g_textCopyLen > 0) {
		NSString *str = [[NSString alloc] initWithBytes:g_textCopy length:g_textCopyLen encoding:NSUTF8StringEncoding];
		if (str) {
			NSFont *font = [NSFont systemFontOfSize:(CGFloat)g_fontSize weight:NSFontWeightMedium];
			NSColor *color = [NSColor colorWithRed:g_fontR green:g_fontG blue:g_fontB alpha:1.0];
			NSDictionary *attrs = @{
				NSFontAttributeName: font,
				NSForegroundColorAttributeName: color
			};
			NSSize strSize = [str sizeWithAttributes:attrs];
			NSPoint pt = NSMakePoint((NSWidth(bounds) - strSize.width) / 2.0, (NSHeight(bounds) - strSize.height) / 2.0);
			[str drawAtPoint:pt withAttributes:attrs];
		}
	}
}
@end

// Center text area: receives most clicks; forwards to show-app when enabled (close button is a separate subview).
@interface OSKOverlayTextField : NSTextField
@end
@implementation OSKOverlayTextField
- (BOOL)acceptsFirstMouse:(NSEvent *)event {
	(void)event;
	return YES;
}
- (void)mouseDown:(NSEvent *)event {
	(void)event;
	if (g_clickShowsApp) {
		oskClickShowAppCallback();
		return;
	}
	[super mouseDown:event];
}
@end

static void updatePanelContent(void) {
	if (!g_panel || !g_contentView) return;
	// Text is drawn in OSKOverlayView drawRect from g_textCopy; NSTextField kept for layout but not used for label.
	if (g_textField) {
		[g_textField setStringValue:@""];
	}
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

// OSKCloseButtonView is a clickable view that dismisses the overlay. Using a custom view with
// mouseDown: and acceptsFirstMouse: ensures the close action fires on a non-activating panel
// (the first click is delivered without the window becoming key).
@interface OSKCloseButtonView : NSView
@end
@implementation OSKCloseButtonView
- (void)drawRect:(NSRect)dirtyRect {
	(void)dirtyRect;
	NSRect bounds = [self bounds];
	[[NSColor colorWithWhite:0.4 alpha:0.6] setFill];
	NSBezierPath *circle = [NSBezierPath bezierPathWithOvalInRect:bounds];
	[circle fill];
	NSFont *font = [NSFont systemFontOfSize:14 weight:NSFontWeightMedium];
	NSDictionary *attrs = @{
		NSFontAttributeName: font,
		NSForegroundColorAttributeName: [NSColor whiteColor]
	};
	NSString *xStr = @"✕";
	NSSize size = [xStr sizeWithAttributes:attrs];
	NSPoint pt = NSMakePoint((NSWidth(bounds) - size.width) / 2.0, (NSHeight(bounds) - size.height) / 2.0);
	[xStr drawAtPoint:pt withAttributes:attrs];
}
- (BOOL)acceptsFirstMouse:(NSEvent *)event {
	(void)event;
	return YES;
}
- (void)mouseDown:(NSEvent *)event {
	(void)event;
	NSLog(@"OSK: close button view mouseDown received");
	oskForceDismissCallback();
}
@end

void darwin_osk_create(void) {
	if (g_panel != nil) {
		return;
	}
	[NSApplication sharedApplication];
	[NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];

	NSRect contentRect = NSMakeRect(0, 0, (CGFloat)g_windowWidth, (CGFloat)g_windowHeight);
	// Nonactivating: panel does not take focus or activate the app when shown (must be set at creation)
	NSUInteger styleMask = NSWindowStyleMaskBorderless | NSWindowStyleMaskNonactivatingPanel;
	g_panel = [[NSPanel alloc] initWithContentRect:contentRect
	                                     styleMask:styleMask
	                                       backing:NSBackingStoreBuffered
	                                         defer:NO];
	[g_panel setLevel:(NSWindowLevel)kCGMaximumWindowLevel];
	[g_panel setOpaque:NO];
	[g_panel setBackgroundColor:[NSColor clearColor]];
	[g_panel setHasShadow:YES];
	// Stay visible when user clicks another app (NSPanel defaults to YES and hides on deactivate)
	[g_panel setHidesOnDeactivate:NO];
	[g_panel setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces | NSWindowCollectionBehaviorFullScreenAuxiliary];

	g_contentView = [[OSKOverlayView alloc] initWithFrame:contentRect];
	[g_contentView setWantsLayer:YES];
	[g_contentView.layer setCornerRadius:(CGFloat)g_cornerRadius];
	[g_contentView.layer setMasksToBounds:YES];
	[g_panel setContentView:g_contentView];

	g_textField = [[OSKOverlayTextField alloc] initWithFrame:NSInsetRect(contentRect, 44, 12)];
	[g_textField setBezeled:NO];
	[g_textField setDrawsBackground:NO];
	[g_textField setEditable:NO];
	[g_textField setSelectable:NO];
	[g_textField setAlignment:NSTextAlignmentCenter];
	[g_textField setFont:[NSFont systemFontOfSize:(CGFloat)g_fontSize weight:NSFontWeightMedium]];
	[g_contentView addSubview:g_textField];

	CGFloat btnSize = 24;
	NSRect closeRect = NSMakeRect(NSWidth(contentRect) - btnSize - 8, NSHeight(contentRect) - btnSize - 8, btnSize, btnSize);
	g_closeButtonView = [[OSKCloseButtonView alloc] initWithFrame:closeRect];
	// Place close button above other subviews so it is frontmost for hit testing.
	[g_contentView addSubview:g_closeButtonView positioned:NSWindowAbove relativeTo:g_textField];
}

// darwin_osk_run_iteration runs one iteration and returns.
// 1) CFRunLoopRunInMode(0) services the main dispatch queue so dispatch_async(main_queue)
//    from SetOnScreenText runs and the panel is shown/updated.
// 2) nextEventMatchingMask + sendEvent delivers one window event so the OSK close button
//    receives mouse clicks (CFRunLoopRunInMode alone does not dispatch AppKit window events).
void darwin_osk_run_iteration(void) {
	CFRunLoopRunInMode(kCFRunLoopDefaultMode, 0, false);
	NSEvent *event = [NSApp nextEventMatchingMask:NSEventMaskAny
		untilDate:[NSDate dateWithTimeIntervalSinceNow:0.05]
		inMode:NSDefaultRunLoopMode
		dequeue:YES];
	if (event != nil) {
		[NSApp sendEvent:event];
	}
}

void darwin_osk_run(void) {
	[NSApp run];
}

typedef struct {
	const char *text;
	size_t textLen;
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
	// Create panel on first show so it is always created on the main thread (this block runs on main queue).
	if (!g_panel) darwin_osk_create();
	if (!g_panel) return;
	if (g_textCopy) {
		free(g_textCopy);
		g_textCopy = NULL;
		g_textCopyLen = 0;
	}
	if (cfg->text && cfg->textLen > 0) {
		g_textCopy = (char *)malloc(cfg->textLen + 1);
		if (g_textCopy) {
			memcpy(g_textCopy, cfg->text, cfg->textLen);
			g_textCopy[cfg->textLen] = '\0';
			g_textCopyLen = cfg->textLen;
		}
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
	const CGFloat minTextW = 280.0;  // ensure "LeftControl + A" etc. is not truncated
	CGFloat textW = minTextW, textH = (CGFloat)g_fontSize;
	if (g_textCopy && g_textCopyLen > 0) {
		NSString *str = [[NSString alloc] initWithBytes:g_textCopy length:g_textCopyLen encoding:NSUTF8StringEncoding];
		NSFont *font = [NSFont systemFontOfSize:(CGFloat)g_fontSize weight:NSFontWeightMedium];
		NSDictionary *attrs = @{ NSFontAttributeName: font };
		NSSize size = [str sizeWithAttributes:attrs];
		if (size.width > textW) textW = size.width;
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
	[g_closeButtonView setFrame:closeRect];

	updatePanelContent();
	positionPanel();
	[g_panel orderFrontRegardless];
}

#define OSK_TEXT_BUF_SIZE 256

void darwin_osk_show_dispatch(int fontSize, double fontR, double fontG, double fontB,
                              double bgR, double bgG, double bgB, double bgAlpha, int cornerRadius,
                              int positionBottom, int offset, int monitorIndex, int width, int height) {
	OSKConfig *cfgCopy = (OSKConfig *)malloc(sizeof(OSKConfig));
	*cfgCopy = (OSKConfig){
		.text = NULL,
		.textLen = 0,
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
	dispatch_async(dispatch_get_main_queue(), ^{
		char buf[OSK_TEXT_BUF_SIZE];
		size_t len = darwin_osk_get_next_show_text(buf, sizeof(buf));
		if (len > 0) {
			cfgCopy->text = (const char *)malloc(len + 1);
			if (cfgCopy->text) {
				memcpy((void *)cfgCopy->text, buf, len);
				((char *)cfgCopy->text)[len] = '\0';
				cfgCopy->textLen = len;
			}
		}
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

// darwin_osk_hide_now hides the panel immediately. Must be called from the main thread (e.g. from close button callback).
void darwin_osk_hide_now(void) {
	if (g_panel) [g_panel orderOut:nil];
}

void darwin_osk_force_dismiss(void) {
	dispatch_async(dispatch_get_main_queue(), ^{
		if (g_panel) [g_panel orderOut:nil];
	});
}
*/
import "C"
