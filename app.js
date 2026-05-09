import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* FIREBASE */

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain: "YOUR_DOMAIN",

    projectId: "YOUR_PROJECT_ID",

    storageBucket: "YOUR_STORAGE",

    messagingSenderId: "YOUR_SENDER_ID",

    appId: "YOUR_APP_ID"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

/* MENU MOBILE */

const menuToggle =
document.querySelector('.menu-toggle');

const menu =
document.querySelector('.menu');

if(menuToggle){

    menuToggle.addEventListener('click',()=>{

        menu.classList.toggle('active');

    });

}

/* START BUTTON */

const startBtn =
document.querySelector('.start-btn');

const input =
document.querySelector('.input-box input');

if(startBtn){

    startBtn.addEventListener('click', async ()=>{

        const userName =
        input.value.trim();

        if(userName === "") return;

        try{

            await addDoc(
                collection(db,"visitors"),
                {
                    ten:userName,
                    createdAt:new Date()
                }
            );

            Swal.fire({
                title:'Chào mừng ✨',
                text:userName,
                icon:'success'
            });

        }catch(err){

            console.log(err);

        }

    });

}

/* REALTIME GALLERY */

const galleryGrid =
document.getElementById('galleryGrid');

if(galleryGrid){

    const q =
    query(
        collection(db,"moments"),
        orderBy("createdAt","desc")
    );

    onSnapshot(q,(snapshot)=>{

        galleryGrid.innerHTML = "";

        snapshot.forEach((doc)=>{

            const data = doc.data();

            galleryGrid.innerHTML += `

            <div class="gallery-card">

                <img src="${data.url}">

                <div class="card-content">

                    <h3>${data.title}</h3>

                </div>

            </div>

            `;

        });

    });

}
