export function splitWeaponScript(script: string): [img: string, script: string] {
    let imageName = "";

    if (script.startsWith("//#IMAGE:")) {
        let sep = script.indexOf('\n');
        imageName = script.substring(9, script.indexOf('\n')).trim();

        // We add an extra line to separate the script from the image so lets remove that now
        if (script.length > sep + 1 && script[sep + 1] === '\n') {
            sep += 1;
        }

        // Skip over the initial '\n'
        script = script.slice(sep + 1);
    }

    if (!script.endsWith('\n')) {
        script += "\n";
    }

    return [imageName, script];
}