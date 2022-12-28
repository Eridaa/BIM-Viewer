import { Color,
        MeshBasicMaterial,
        LineBasicMaterial} from "three";
import {IfcViewerAPI} from "web-ifc-viewer";
import { projects } from "./projects.js";

 
let model;
let enablePick = false;
let enableHide = false;
let enableMeasure = false;
let enableClip = false;
let enablePlan = false;

const pickButton = document.getElementById("pickbutton");
const hideButton = document.getElementById("hidebutton");
const measureButton = document.getElementById("measurebutton");
const clipButton = document.getElementById("clipbutton");
const planButton = document.getElementById("planbutton");

let allIDs;
const container = document.getElementById("container")
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(255,255,255)});
const planContainer = document.getElementById('button-container');

const controls = viewer.context.ifcCamera.cameraControls;
controls.setPosition(20,20,20, false);
controls.setTarget(0,0,0,false);
viewer.axes.setAxes();
viewer.grid.setGrid();


// Get the current project ID from the URL parameter
const currentUrl = window.location.href; 
const url = new URL(currentUrl);
const currentProjectID = url.searchParams.get("id");
console.log(currentProjectID);

// Get the current project
if (currentProjectID == "1" ||
    currentProjectID == "2" ||
    currentProjectID == "3" ||
    currentProjectID == "4" ||
    currentProjectID == "5")
{
const currentProject = projects.find(project => project.id === currentProjectID);
model = await  viewer.IFC.loadIfcUrl(currentProject.url);
allIDs = getAllIds(model);
}
else
{   
    const loadbutton = document.getElementById("loadfile");
    loadbutton.classList.remove("hidden");
    loadbutton.classList.add("button");

    const input = document.getElementById("file-input")
    loadbutton.onclick = () =>{
        input.click();
        input.onchange = () =>{

        const url = URL.createObjectURL(input.files[0]);
        model = viewer.IFC.loadIfcUrl(url);
        allIDs = getAllIds(model);
        }
    }
}



//#region PICK
//1. Pick geometry

const propsGUI = document.getElementById("ifc-property-menu-root")

pickButton.onclick=() =>{
    enablePick=!enablePick;

    hideButton.classList.add("disable");
    measureButton.classList.add("disable");
    clipButton.classList.add("disable");
    planButton.classList.add("disable");

    if(enablePick){
        pickButton.classList.add("buttonhover");
        propsGUI.classList.remove("hidden");

        window.onmousemove= async () => await viewer.IFC.selector.prePickIfcItem();
        window.onclick = async () => {
            const result = await viewer.IFC.selector.highlightIfcItem();
            if (!result) return;
            const { modelID, id } = result;
            const props = await viewer.IFC.getProperties(modelID, id, true, false);
            createPropertiesMenu(props);
        };
    }    
    else{
        viewer.IFC.selector.unHighlightIfcItems();
        removeAllChildren(propsGUI);
        propsGUI.classList.add("hidden");
        pickButton.classList.remove("buttonhover");
        window.onclick = null;
        window.onmousemove = null;

        hideButton.classList.remove("disable");
        measureButton.classList.remove("disable");
        clipButton.classList.remove("disable");
        planButton.classList.remove("disable");
    }
}

//#endregion

//#region HIDE
//2. Hide geometry


hideButton.onclick=() =>{
    pickButton.classList.add("disable");
    measureButton.classList.add("disable");
    clipButton.classList.add("disable");
    planButton.classList.add("disable");

    enableHide=!enableHide;
    if(enableHide){
        hideButton.classList.add("buttonhover");
	    const subset = getWholeSubset(viewer, model, allIDs);
	    replaceOriginalModelBySubset(viewer, model, subset);
	    setupEvents(viewer, allIDs);

    }   
    else{
        
        hideButton.classList.remove("buttonhover");
        showAllItems(viewer, allIDs);
        window.onclick = null;
        window.onkeydown = null;

        pickButton.classList.remove("disable");
        measureButton.classList.remove("disable");
        clipButton.classList.remove("disable");
        planButton.classList.remove("disable");
    }
}
//#endregion

//#region MEASURE
// 3. Measure geometry


measureButton.onclick = () => {
    pickButton.classList.add("disable");
    hideButton.classList.add("disable");
    clipButton.classList.add("disable");
    planButton.classList.add("disable");

    enableMeasure=!enableMeasure;
    if(enableMeasure){
        measureButton.classList.add("buttonhover");
        
        viewer.dimensions.active = true;
        viewer.dimensions.previewActive = true;
        window.onclick = () =>{
            viewer.dimensions.create();
        }
        window.onkeydown = (event) =>{
            if(event.code ==='Delete'){
                viewer.dimensions.delete();
            }
        }
    }
    else{
        measureButton.classList.remove("buttonhover");
        viewer.dimensions.deleteAll();
        viewer.dimensions.active = false;
        viewer.dimensions.previewActive = false;
        window.onclick = null;
        window.onkeydown = null;

        pickButton.classList.remove("disable");
        hideButton.classList.remove("disable");
        clipButton.classList.remove("disable");
        planButton.classList.remove("disable");
    }



}
//#endregion

//#region CLIP
// 4. Add clipping planes


clipButton.onclick = () => {

    pickButton.classList.add("disable");
    hideButton.classList.add("disable");
    measureButton.classList.add("disable");
    planButton.classList.add("disable");

    enableClip=!enableClip;
    if(enableClip){
        clipButton.classList.add("buttonhover");
        
        viewer.clipper.active = true;
        viewer.clipper.createPlane();

        
        window.onclick = () => {
            viewer.clipper.createPlane();
        }

        window.onkeydown = (event) =>{
            if(event.code === 'Delete'){
                viewer.clipper.deletePlane();
            }
        }
        
    }
    else{
        clipButton.classList.remove("buttonhover");
        
        
        viewer.clipper.deleteAllPlanes();
        viewer.clipper.active = false;
        window.onclick = null;
        window.onkeydown = null;

        pickButton.classList.remove("disable");
        hideButton.classList.remove("disable");
        measureButton.classList.remove("disable");
        planButton.classList.remove("disable");
    }

}

//#endregion

//#region PLANS
// 4. Generate plans


planButton.onclick = async () => {

    pickButton.classList.add("disable");
    hideButton.classList.add("disable");
    clipButton.classList.add("disable");

    enablePlan=!enablePlan;
    if(enablePlan){
        planButton.classList.add("buttonhover");
        await viewer.plans.computeAllPlanViews(model.modelID);

        const lineMaterial = new LineBasicMaterial({ color: 'black' });
        const baseMaterial = new MeshBasicMaterial({
            polygonOffset: true,
            polygonOffsetFactor: 1, // positive value pushes polygon further away
            polygonOffsetUnits: 1,
        });
        await viewer.edges.create('example', model.modelID, lineMaterial, baseMaterial);

        const allPlans = viewer.plans.getAll(model.modelID);

        for (const plan of allPlans) {
            const currentPlan = viewer.plans.planLists[model.modelID][plan];
            console.log(currentPlan);

            const button = document.createElement('button');
            planContainer.appendChild(button);
            button.textContent = currentPlan.name;
            button.onclick = () => {
                viewer.plans.goTo(model.modelID, plan);
                viewer.edges.toggle('example', true);
            };
        }

        const button = document.createElement('button');
        planContainer.appendChild(button);
        button.textContent = 'Exit';
        button.onclick = () => {
            viewer.plans.exitPlanView();
            viewer.edges.toggle('example', false);
        };  
    }

    else{
        planButton.classList.remove("buttonhover");
        viewer.plans.exitPlanView();
        viewer.edges.toggle('example', false);
        removeAllChildren(planContainer);

        pickButton.classList.remove("disable");
        hideButton.classList.remove("disable");
        clipButton.classList.remove("disable");
    }

}

//#endregion


//#region FUNCTIONS
//pick functions
function createPropertiesMenu(properties){
    
    removeAllChildren(propsGUI);

    delete properties.psets;
    delete properties.mats;
    delete properties.type;

    for (let key in properties){
        createPropertyEntry(key, properties[key])
    }
}

function createPropertyEntry (key, value){
    const propContainer = document.createElement ("div");
    propContainer.classList.add("ifc-property-menu-root");

    if(value===null || value === undefined) value="undefined";
    else if(value.value) value = value.value;

    const keyElement = document.createElement("div");
    keyElement.textContent = key;
    propContainer.appendChild(keyElement);

    const valueElement = document.createElement("div");
    valueElement.classList.add("ifc-property-value");
    valueElement.textContent = value;
    propContainer.appendChild(valueElement);

    propsGUI.appendChild(propContainer);
}

function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

//hide funcions
function setupEvents(viewer, allIDs) {
	window.onclick = () => hideClickedItem(viewer);
	window.onkeydown = (event) => {
		if (event.code === 'Escape') {
			showAllItems(viewer, allIDs);
		}
	};
}

function getAllIds(ifcModel) {
	return Array.from(
		new Set(ifcModel.geometry.attributes.expressID.array),
	);
}

function replaceOriginalModelBySubset(viewer, ifcModel, subset) {
	const items = viewer.context.items;
	items.pickableIfcModels = items.pickableIfcModels.filter(model => model !== ifcModel);
	items.ifcModels = items.ifcModels.filter(model => model !== ifcModel);
	ifcModel.removeFromParent();

	items.ifcModels.push(subset);
	items.pickableIfcModels.push(subset);
}

function getWholeSubset(viewer, ifcModel, allIDs) {
	return viewer.IFC.loader.ifcManager.createSubset({
		modelID: ifcModel.modelID,
		ids: allIDs,
		applyBVH: true,
		scene: ifcModel.parent,
		removePrevious: true,
		customID: 'full-model-subset',
	});
}


function showAllItems(viewer, ids) {
	viewer.IFC.loader.ifcManager.createSubset({
		modelID: 0,
		ids,
		removePrevious: false,
		applyBVH: true,
		customID: 'full-model-subset',
	});
}

function hideClickedItem(viewer) {
	const result = viewer.context.castRayIfc();
	if (!result) return;
	const manager = viewer.IFC.loader.ifcManager;
	const id = manager.getExpressId(result.object.geometry, result.faceIndex);
	viewer.IFC.loader.ifcManager.removeFromSubset(
		0,
		[id],
		'full-model-subset',
	);
}



//#endregion