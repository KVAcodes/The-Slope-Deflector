// AUTHOR: KADIRI VICTOR

// Getting the menu buttons

// menu buttons
beamButton = document.getElementById("beam-button");
supportButton = document.getElementById("support-button");
sectionButton = document.getElementById("section-button");
settlementButton = document.getElementById("settlement-button");
plButton = document.getElementById("pl-button");
dlButton = document.getElementById("dl-button");
mButton = document.getElementById("m-button");
// back button
backButton = document.getElementById("back-button");
// add button
addButton = document.getElementById("add-button");


// Adding event listeners to the buttons

// menu buttons
beamButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Beam']").classList.remove("d-none");
});

supportButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Support']").classList.remove("d-none");
});

sectionButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Section']").classList.remove("d-none");
});

settlementButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Settlement']").classList.remove("d-none");
});

plButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Point Load']").classList.remove("d-none");
});

dlButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Distributed Load']").classList.remove("d-none");
});

mButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.add("d-none");
    document.querySelector(".menu-inputs").classList.remove("d-none"); 
    document.querySelector("[element-type='Moments']").classList.remove("d-none");
});

// back button
// add an event listener to the back button that will add the d-none class to either of the element-type classes without the d-none class and remove the d-none class from the menu-buttons class
backButton.addEventListener("click", function () {
    document.querySelector(".menu-buttons").classList.remove("d-none");
    document.querySelector(".menu-inputs").classList.add("d-none"); 
    document.querySelector(".menu-input-inputs > div:not(.d-none)").classList.add("d-none");
});


// DATA COLLECTION

// beam data
