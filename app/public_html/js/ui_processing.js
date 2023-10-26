class UiHandler {

    static fillFilesList(data, containerId = '#files_list') {
        const maxSize = Math.max(data.oculusFiles.length, data.tabletFiles.length);
        let oculusSelection = "<select id='oculusSelect'  size=" + maxSize + ">";
        for (let i = 0; i < data.oculusFiles.length; i++) {
            const oculus = data.oculusFiles[i];
            oculusSelection += '<option value="' + oculus + '">' + oculus + '</option>';
        }
        oculusSelection += '</select>';

        let tabletSelection = "<select id='tabletSelect'  size=" + maxSize + ">";
        for (let i = 0; i < data.tabletFiles.length; i++) {
            const tablet = data.tabletFiles[i];
            tabletSelection += '<option value="' + tablet + '">' + tablet + '</option>';
        }
        tabletSelection += '</select>';

        document.querySelector(containerId).innerHTML = oculusSelection + tabletSelection;
    }

    static loadFiles(drawingEngine, websocket) {
        drawingEngine.DrawImage("img/drawing_patterns_shapes.png", () => {
            let tabletFile = document.getElementById("tabletSelect").value;
            if (tabletFile.length > 0) {
                websocket.Send({ ctrl: "get_file", filename: tabletFile });
            }
        });
    }
}
