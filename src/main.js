import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBD4APe-XvwV5t1nRb8DrSD77l9SHeCdC4",
  authDomain: "mindmap-test-5701e.firebaseapp.com",
  projectId: "mindmap-test-5701e",
  storageBucket: "mindmap-test-5701e.appspot.com",
  messagingSenderId: "809087588158",
  appId: "1:809087588158:web:4decfc8bf96a0d168b7e6f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

createApp(App)
  .use(store)
  .use(router)
  .use(VNetworkGraph)
  .mount("#app");
