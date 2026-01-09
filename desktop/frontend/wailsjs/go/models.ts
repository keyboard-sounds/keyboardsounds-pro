export namespace app {
	
	export class MousePanState {
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new MousePanState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	    }
	}
	export class EqualizerState {
	    enabled: boolean;
	    config: audio.EqualizerConfig;
	
	    static createFrom(source: any = {}) {
	        return new EqualizerState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.config = this.convertValues(source["config"], audio.EqualizerConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PanState {
	    enabled: boolean;
	    panType: string;
	    maxX: number;
	
	    static createFrom(source: any = {}) {
	        return new PanState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.panType = source["panType"];
	        this.maxX = source["maxX"];
	    }
	}
	export class PitchShiftState {
	    enabled: boolean;
	    lower: number;
	    upper: number;
	
	    static createFrom(source: any = {}) {
	        return new PitchShiftState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.lower = source["lower"];
	        this.upper = source["upper"];
	    }
	}
	export class AudioEffectsState {
	    keyboardPitchShift: PitchShiftState;
	    keyboardPan: PanState;
	    keyboardEqualizer: EqualizerState;
	    mousePitchShift: PitchShiftState;
	    mousePan: MousePanState;
	    mouseEqualizer: EqualizerState;
	
	    static createFrom(source: any = {}) {
	        return new AudioEffectsState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.keyboardPitchShift = this.convertValues(source["keyboardPitchShift"], PitchShiftState);
	        this.keyboardPan = this.convertValues(source["keyboardPan"], PanState);
	        this.keyboardEqualizer = this.convertValues(source["keyboardEqualizer"], EqualizerState);
	        this.mousePitchShift = this.convertValues(source["mousePitchShift"], PitchShiftState);
	        this.mousePan = this.convertValues(source["mousePan"], MousePanState);
	        this.mouseEqualizer = this.convertValues(source["mouseEqualizer"], EqualizerState);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AudioFile {
	    name: string;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new AudioFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	    }
	}
	export class DirectorySelection {
	    path: string;
	    audioFiles: AudioFile[];
	
	    static createFrom(source: any = {}) {
	        return new DirectorySelection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.audioFiles = this.convertValues(source["audioFiles"], AudioFile);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class ProfileSource {
	    name: string;
	    pressSound: string;
	    releaseSound?: string;
	    isDefault: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProfileSource(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.pressSound = source["pressSound"];
	        this.releaseSound = source["releaseSound"];
	        this.isDefault = source["isDefault"];
	    }
	}
	export class ProfileMetadata {
	    name: string;
	    description: string;
	    author: string;
	
	    static createFrom(source: any = {}) {
	        return new ProfileMetadata(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.author = source["author"];
	    }
	}
	export class KeyboardBuildRequest {
	    metadata: ProfileMetadata;
	    sources: ProfileSource[];
	    keyAssignments: Record<string, Array<string>>;
	    directory: string;
	
	    static createFrom(source: any = {}) {
	        return new KeyboardBuildRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.metadata = this.convertValues(source["metadata"], ProfileMetadata);
	        this.sources = this.convertValues(source["sources"], ProfileSource);
	        this.keyAssignments = source["keyAssignments"];
	        this.directory = source["directory"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProfileData {
	    id: string;
	    name: string;
	    description: string;
	    author: string;
	    type: string;
	    inUse: boolean;
	    inUseReason: string;
	
	    static createFrom(source: any = {}) {
	        return new ProfileData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.author = source["author"];
	        this.type = source["type"];
	        this.inUse = source["inUse"];
	        this.inUseReason = source["inUseReason"];
	    }
	}
	export class LibraryState {
	    keyboardProfiles: ProfileData[];
	    mouseProfiles: ProfileData[];
	
	    static createFrom(source: any = {}) {
	        return new LibraryState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.keyboardProfiles = this.convertValues(source["keyboardProfiles"], ProfileData);
	        this.mouseProfiles = this.convertValues(source["mouseProfiles"], ProfileData);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MouseBuildRequest {
	    metadata: ProfileMetadata;
	    sources: ProfileSource[];
	    mouseAssignments: Record<string, string>;
	    directory: string;
	
	    static createFrom(source: any = {}) {
	        return new MouseBuildRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.metadata = this.convertValues(source["metadata"], ProfileMetadata);
	        this.sources = this.convertValues(source["sources"], ProfileSource);
	        this.mouseAssignments = source["mouseAssignments"];
	        this.directory = source["directory"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	
	
	export class RuleData {
	    appPath: string;
	    executableName: string;
	    keyboardProfile?: string;
	    mouseProfile?: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new RuleData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.appPath = source["appPath"];
	        this.executableName = source["executableName"];
	        this.keyboardProfile = source["keyboardProfile"];
	        this.mouseProfile = source["mouseProfile"];
	        this.enabled = source["enabled"];
	    }
	}
	export class StatusPanelState {
	    enabled: boolean;
	    keyboardVolume: number;
	    mouseVolume: number;
	    keyboardProfile?: string;
	    mouseProfile?: string;
	    keyboardProfiles: string[];
	    mouseProfiles: string[];
	
	    static createFrom(source: any = {}) {
	        return new StatusPanelState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.keyboardVolume = source["keyboardVolume"];
	        this.mouseVolume = source["mouseVolume"];
	        this.keyboardProfile = source["keyboardProfile"];
	        this.mouseProfile = source["mouseProfile"];
	        this.keyboardProfiles = source["keyboardProfiles"];
	        this.mouseProfiles = source["mouseProfiles"];
	    }
	}

}

export namespace audio {
	
	export class EqualizerConfig {
	    hz60: number;
	    hz170: number;
	    hz310: number;
	    hz600: number;
	    hz1k: number;
	    hz3k: number;
	    hz6k: number;
	    hz12k: number;
	    hz14k: number;
	    hz16k: number;
	
	    static createFrom(source: any = {}) {
	        return new EqualizerConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hz60 = source["hz60"];
	        this.hz170 = source["hz170"];
	        this.hz310 = source["hz310"];
	        this.hz600 = source["hz600"];
	        this.hz1k = source["hz1k"];
	        this.hz3k = source["hz3k"];
	        this.hz6k = source["hz6k"];
	        this.hz12k = source["hz12k"];
	        this.hz14k = source["hz14k"];
	        this.hz16k = source["hz16k"];
	    }
	}

}

export namespace hotkeys {
	
	export class HotKeyDeviceAction {
	    action: string;
	    target: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new HotKeyDeviceAction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.action = source["action"];
	        this.target = source["target"];
	        this.value = source["value"];
	    }
	}
	export class HotKey {
	    key: string;
	    action: HotKeyDeviceAction;
	
	    static createFrom(source: any = {}) {
	        return new HotKey(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.action = this.convertValues(source["action"], HotKeyDeviceAction);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class HotKeyGroup {
	    modifiers: string[];
	    keys: HotKey[];
	
	    static createFrom(source: any = {}) {
	        return new HotKeyGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.modifiers = source["modifiers"];
	        this.keys = this.convertValues(source["keys"], HotKey);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace rules {
	
	export class InstalledApplication {
	    name: string;
	    executable_path: string;
	
	    static createFrom(source: any = {}) {
	        return new InstalledApplication(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.executable_path = source["executable_path"];
	    }
	}
	export class Profiles {
	    keyboard?: string;
	    mouse?: string;
	
	    static createFrom(source: any = {}) {
	        return new Profiles(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.keyboard = source["keyboard"];
	        this.mouse = source["mouse"];
	    }
	}

}

