import { projects } from "./projects.js";

// Get all cards
const testbutton = document.getElementById("main-button");
const baseURL = './model-viewer.html';
testbutton.onclick= () => {
    
    
    const projectContainer = document.getElementById("projects-container");
    projectContainer.classList.remove("hidden");
    projectContainer.classList.add("project-list");
    const projectCards = Array.from(projectContainer.children);    
    const templateProjectCard = projectCards[0];
    
    for(let project of projects) {
    
        // Create a new card
        const newCard = templateProjectCard.cloneNode(true);
        //Add respective iframe
        const iframe = newCard.querySelector('iframe');
        iframe.src = project.iframe;
        // Add project URL to card
        const button = newCard.querySelector('a');
        button.href = baseURL + `?id=${project.id}`;
        console.log(button.href);
        // Add card to container
        projectContainer.appendChild(newCard);
    }
    
    templateProjectCard.remove();

    const section = document.getElementById("testsection");
    section.remove();
}

  
    
