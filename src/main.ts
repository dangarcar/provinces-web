import { createApp } from 'vue'
import './style.css'

import 'leaflet/dist/leaflet.css'
import L from "leaflet"
import iconUrl from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl: iconShadow
})


import App from './App.vue'

const app = createApp(App)
app.mount('#app')
