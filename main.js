const { resolve, basename, join } = require('path');
const fs = require('fs');
const spawn = require('cross-spawn');
const Store = require('electron-store');
const { app, BrowserWindow, Menu, MenuItem, Tray, dialog } = require('electron');

const iconTemplateUrl = resolve(__dirname, 'assets', 'iconTemplate.png');
const iconVs = resolve(__dirname, 'assets', 'iconVS.png');
const iconSettings = resolve(__dirname, 'assets', 'iconSettings.png');
const iconCMD = resolve(__dirname, 'assets', 'iconCMD.png');
const iconFolder = resolve(__dirname, 'assets', 'iconFolder.png');
const iconRemove = resolve(__dirname, 'assets', 'iconRemove.png');

const store = new Store();

let appTray = null;

app.on('ready', () => {
    startTray();

    console.log(`Running`);

});

function startTray() {
    appTray = new Tray(iconTemplateUrl);
    renderTray();
}


function renderTray() {

    const projects = getProjects();

    const separator = { type: 'separator' };
    const menuItems = renderProjects(projects);

    const contextMenu = Menu.buildFromTemplate([
        { type: 'normal', label: 'Projetos | MTS', enabled: false },
        settingsButton(),
        separator,
        ...menuItems
    ]);

    contextMenu.append(new MenuItem({ ...newButton(contextMenu) }));

    appTray.setToolTip(`Most used Projects`);

    // Call this again for Linux because we modified the context menu
    appTray.setContextMenu(contextMenu);
}

function newButton(contextMenu) {
    return new MenuItem({
        label: 'Add New Project',
        type: 'normal',
        click: async () => {
            const path = await dialog.showOpenDialog({ properties: ['openDirectory'] });

            if (path !== undefined && path.filePaths[0] !== undefined) {
                const newItem = saveProject(path.filePaths[0]);
                contextMenu.insert(contextMenu.items.length - 1, new MenuItem({ ...renderProjectItem(newItem) }));
            }
        }
    })
}


function settingsButton() {
    return new MenuItem({
        label: 'Settings',
        type: 'submenu',
        icon: iconSettings,
        submenu: [
            new MenuItem({
                label: 'Restore projects',
                type: 'normal',
                click: () => {
                    clearProject();
                    renderTray();
                }
            }),
            { type: 'separator' },
            new MenuItem({
                label: 'CMD',
                type: 'normal',
                icon: iconCMD,
                click: () => {
                    spawn.sync('start');
                }
            }),
        ]
    })
}

function renderProjects(projects) {
    return projects.map(project => renderProjectItem(project));
}

function renderProjectItem(project) {
    return new MenuItem({
        type: 'submenu',
        label: project.name,
        icon: project.icon ? project.icon : null,
        submenu: [
            // project.hasSln ?
            //     new MenuItem({
            //         type: 'normal',
            //         label: 'VS',
            //         icon: iconVs,
            //         click: () => {
            //             const slnFile = getSomeExtention(project.path, 'sln');
            //             //const result = spawn.sync('devenv', [slnFile]);
            //             const result = spawn.sync('devenv');
            //             console.log(`result`, result)

            //         }
            //     }) : [],
            new MenuItem({
                type: 'normal',
                label: 'VS Code',
                icon: iconTemplateUrl,
                click: () => {
                    spawn.sync('code', [project.path])

                }
            }),
            new MenuItem({
                type: 'normal',
                label: 'Folder',
                icon: iconFolder,
                click: () => {
                    spawn.sync('start .', [project.path])

                }
            }),
            new MenuItem({
                type: 'normal',
                label: 'CMD',
                icon: iconCMD,
                click: () => {
                    spawn.sync('start', [project.path])

                }
            }),
            { type: 'separator' },
            new MenuItem({
                type: 'normal',
                label: 'Remove',
                icon: iconRemove,
                click: () => {
                    removeProject(project.path);
                    renderTray();
                }
            })
        ]
    });
}


function saveProject(value) {
    const projects = getProjects();
    const hasSln = hasSomeExtention(value, '.sln');
    const newItem = {
        path: value,
        name: basename(value),
        icon: hasSomeExtention(value, '.sln') ? iconVs : iconTemplateUrl,
        hasSln
    };
    store.set('project', JSON.stringify([...projects, newItem]));
    return newItem;
}

function removeProject(value) {
    let projects = getProjects();
    projects = projects.filter(project => project.path !== value);
    store.set('project', JSON.stringify(projects));
}

function clearProject() {
    store.set('project', JSON.stringify([]));
}

function getProjects() {
    const projects = store.get('project');
    if (!projects)
        return [];
    else
        return JSON.parse(projects);
}

function hasSomeExtention(startPath, filter) {
    if (!fs.existsSync(startPath)) {
        return false;
    }

    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (!stat.isDirectory() && filename.indexOf(filter) >= 0) {
            return true;
        };
    };
    return false;
};

function getSomeExtention(startPath, filter) {
    if (!fs.existsSync(startPath)) {
        return false;
    }

    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (!stat.isDirectory() && filename.indexOf(filter) >= 0) {
            return filename;
        };
    };
    return false;
};

