"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reloadConfig = exports.styles = exports.HELMLLayersList = void 0;
const vscode = __importStar(require("vscode"));
const HELML_1 = __importDefault(require("./HELML"));
const blocklook = __importStar(require("./blocklook"));
exports.HELMLLayersList = ['0'];
exports.styles = {};
function reloadConfig(event = null) {
    const config = vscode.workspace.getConfiguration('helml');
    const extname = 'helml';
    const enableident = config.get('enableident');
    const enablebones = config.get('enablebones');
    const enableuplines = config.get('enableuplines');
    const enablehashsym = config.get('enablehashsym');
    if (enableident !== undefined && enableident !== HELML_1.default.ENABLE_SPC_IDENT) {
        // config.update('enableident', enableident, true);
        HELML_1.default.ENABLE_SPC_IDENT = enableident;
    }
    if (enablebones !== undefined && enablebones !== HELML_1.default.ENABLE_BONES) {
        // config.update('enablebones', enablebones, true);
        HELML_1.default.ENABLE_BONES = enablebones;
    }
    if (enableuplines !== undefined && enableuplines !== HELML_1.default.ENABLE_KEY_UPLINES) {
        // config.update('enableuplines', enableuplines, true);
        HELML_1.default.ENABLE_KEY_UPLINES = enableuplines;
    }
    if (enablehashsym !== undefined && enableuplines !== HELML_1.default.ENABLE_HASHSYMBOLS) {
        // config.update('enablehashsym', enablehashsym, true);
        HELML_1.default.ENABLE_HASHSYMBOLS = enablehashsym;
    }
    if (event === null || event.affectsConfiguration(extname + '.getlayers')) {
        const getlayers = config.get('getlayers');
        if (getlayers) {
            exports.HELMLLayersList = [];
            const layers = getlayers.split(',');
            layers.forEach(layer => exports.HELMLLayersList.push(layer.trim()));
        }
    }
    if (event === null || event.affectsConfiguration(extname + '.style.upkey')) {
        const upKeyStyleStr = config.get('style.upkey');
        if (upKeyStyleStr) {
            const upKeyStyleObj = HELML_1.default.decode(upKeyStyleStr);
            if (upKeyStyleObj) {
                exports.styles.upkey = upKeyStyleObj;
            }
        }
    }
    if (event === null || event.affectsConfiguration(`${extname}.style`)) {
        const configStyle = config.get('style');
        if (configStyle) {
            exports.styles = {};
            for (const key of Object.keys(configStyle)) {
                const styleStr = configStyle[key];
                if (styleStr) {
                    const styleObj = HELML_1.default.decode(styleStr);
                    if (styleObj) {
                        exports.styles[key] = styleObj;
                    }
                }
            }
            blocklook.reloadConfig();
        }
    }
}
exports.reloadConfig = reloadConfig;
reloadConfig();
// Auto-update config on changes
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('helml')) {
        reloadConfig(event);
    }
});
