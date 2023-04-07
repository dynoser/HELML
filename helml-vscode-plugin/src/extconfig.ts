import * as vscode from 'vscode';
import HELML from './HELML';

export let HELMLLayersList: string[] = ['0'];

export function reloadConfig(event: vscode.ConfigurationChangeEvent | null = null) {
    const config = vscode.workspace.getConfiguration('helml');
    const extname = 'helml';

    const enableident = config.get<boolean>('enableident');
    const enablebones = config.get<boolean>('enablebones');
    const enableuplines = config.get<boolean>('enableuplines');
    const enablehashsym = config.get<boolean>('enablehashsym');

    if (enableident !== undefined && enableident !== HELML.ENABLE_SPC_IDENT) {
        config.update('enableident', enableident, true);
        HELML.ENABLE_SPC_IDENT = enableident;
    }

    if (enablebones !== undefined && enablebones !== HELML.ENABLE_BONES) {
        config.update('enablebones', enablebones, true);
        HELML.ENABLE_BONES = enablebones;
    }

    if (enableuplines !== undefined && enableuplines !== HELML.ENABLE_KEY_UPLINES) {
        config.update('enableuplines', enableuplines, true);
        HELML.ENABLE_KEY_UPLINES = enableuplines;
    }

    if (enablehashsym !== undefined && enableuplines !== HELML.ENABLE_HASHSYMBOLS) {
        config.update('enablehashsym', enablehashsym, true);
        HELML.ENABLE_HASHSYMBOLS = enablehashsym;
    }

    if (event === null || event.affectsConfiguration(extname + '.getlayers')) {
        const getlayers = config.get<string>('getlayers');
        if (getlayers) {
            HELMLLayersList = [];
            const layers = getlayers.split(',');
            layers.forEach(layer => HELMLLayersList.push(layer.trim()));
        }
    }
}

reloadConfig();

// Auto-update config on changes
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('helml')) {
        reloadConfig(event);
    }
});
