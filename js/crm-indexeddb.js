let db;

let borrarBd = false;
let borrarDatos = false;

function borrarBaseDatos(){
    
    if(borrarBd){
        let deleteRequest = indexedDB.deleteDatabase("CRM_Database");
        deleteRequest.onsuccess = function() {
            console.log("Base de datos borrada correctamente");
        };
        deleteRequest.onerror = function(event) {
            console.error("Error al borrar la base de datos");
        }
        borrarBd = false;     
    }

    if(borrarDatos && db) {
        const tx = db.transaction("clients", "readwrite");
        const store = tx.objectStore("clients");

        store.clear();
        
        tx.oncomplete = () => {
            const lista = document.querySelector("#client-list");
            lista.innerHTML = "";

            console.log("todos los datos borrados");
            borrarDatos = false;
        };
        tx.onerror = () => console.log("error al borrar datos");

        
        borrarDatos = false;
    }

}

borrarBaseDatos(); 
const request = indexedDB.open("CRM_Database", 1);

request.onerror = function(event) {
    console.error("Error abriendo IndexedDB", event);
};

request.onsuccess = function(event) {
    db = event.target.result;
    //borrarBaseDatos();
    fetchClients(); // Cargar clientes almacenados
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if(!db.objectStoreNames.contains('clients')) {
        const objectStore = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('email', 'email', { unique: true });
        objectStore.createIndex('phone', 'phone', { unique: false });
    }
};



// --- VALIDACIONES ---
const form = document.getElementById('client-form');
const addBtn = document.getElementById('add-btn');
const inputs = form.querySelectorAll('input');
let inputNombre = form.querySelector("#name"); 
let inputEmail = form.querySelector("#email");
let inputTelefono = form.querySelector("#phone");

// --- Validaciones y activación botón ---

inputs.forEach(input => {
    input.addEventListener('blur', e => { 
        inputBien(e.target);
        activarDesactivarBtn();
     });
});

// --- AGREGAR CLIENTE ---
form.addEventListener('submit', e => {
    e.preventDefault();
    
    if(!db) {
        console.error("La base de datos no está lista");
        return;
    }
    
    let nombre = inputNombre.value.trim();
    let email = inputEmail.value.trim();
    let telef = inputTelefono.value.trim(); 

    const tx = db.transaction("clients", "readwrite");
    const store = tx.objectStore("clients");
    store.add({ name: nombre, email: email, phone: telef});
    
    tx.oncomplete = () => {
        console.log("Cliente añadido correctamente");
        fetchClients();
    };
    
    tx.onerror = (error) => console.error("Error al añadir cliente", error);
});

// --- LISTADO DINÁMICO ---
function fetchClients() {
    const tx = db.transaction("clients", "readonly");
    const store = tx.objectStore("clients");
    const request = store.getAll();
    
    request.onsuccess = () => {
        const clientes = request.result;
        const lista = document.querySelector("#client-list");
        lista.innerHTML = "";
        
        clientes.forEach(cliente => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div><strong>ID: ${cliente.id}</strong> | Nombre: ${cliente.name} — Email: ${cliente.email} — Teléfono: ${cliente.phone}</div>
                <div>
                    <button class="editar-btn">Editar</button>
                    <button class="eliminar-btn">Eliminar</button>
                </div>
            `;
            lista.appendChild(li);
            
            
            const editarBtn = li.querySelector(".editar-btn");
            editarBtn.addEventListener("click", () => {
                window.editClient(cliente.id);
            });
            
            const eliminarBtn = li.querySelector(".eliminar-btn");
            eliminarBtn.addEventListener("click", () => {
                window.deleteClient(cliente.id);
            });
        });
    };
}

// --- EDITAR CLIENTE ---
window.editClient = function(id) {
    const tx = db.transaction("clients", "readwrite");
    const store = tx.objectStore("clients");
    store.put({ id: id, name: "Nombre", email: "example@correo.es", phone: "000000000"}); 
    fetchClients();
};

// --- ELIMINAR CLIENTE ---
window.deleteClient = function(id) {
    const tx = db.transaction("clients", "readwrite");
    const store = tx.objectStore("clients");
    store.delete(id);
    fetchClients();
};



function comprobarNombre(nombre){
    const regex = /^[a-zA-Z\s]+$/;
    return regex.test(nombre);
}

function comprobarEmail(email){
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

function comprobarTelefono(telef){
    const regex = /^[0-9]{9}$/;
    return regex.test(telef)
}

function generarErrorInput(input, mensaje){
    const p = document.createElement("p");

    if (input.classList.contains("input-mal")) {
        return;
    }

    if (input.classList.contains("input-bien")) {
        input.classList.remove("input-bien");
    }

    p.textContent = mensaje;
    p.style.margin = "0";
    p.classList.add("mensaje-error");

    input.classList.add("input-mal");
    input.insertAdjacentElement('afterend', p);
}

function generarBienInput(input){
    input.classList.remove("input-mal");
    input.classList.add("input-bien");
    const p = input.parentNode.querySelector("p")
    if (p != null) p.remove();
}

function inputBien(input){
    let bien = true;
    let valor;
    switch (input) {
        case inputNombre:
            valor = inputNombre.value.trim();

            if(!comprobarNombre(valor)){
                const msj = "Nombre no válido";
                generarErrorInput(inputNombre, msj);
                console.error(msj);
                bien = false;
            }
            break;
        case inputEmail:
            valor = inputEmail.value.trim();

            if(!comprobarEmail(valor)){
                const msj = "Email no válido";
                generarErrorInput(inputEmail, msj);
                console.error(msj);
                bien = false;
            }
            break;
        case inputTelefono:
            valor = inputTelefono.value.trim();

            if(!comprobarTelefono(valor)){
                const msj = "El número de télefono no es válido";
                generarErrorInput(inputTelefono, msj);
                console.error(msj);
                bien = false;
            }
            break;
    }

    if(bien) {
        input.classList.remove("input-mal");
        generarBienInput(input);
    }
    return bien;
}


function activarDesactivarBtn(){
    let todosBien = true;
    inputs.forEach(input => {
        if (!input.classList.contains("input-bien") || input.value.trim() === "") {
            todosBien = false;
        }
    });

    addBtn.disabled = (todosBien) ? false : true;
}