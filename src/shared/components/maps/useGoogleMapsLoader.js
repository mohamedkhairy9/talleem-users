import { useJsApiLoader } from '@react-google-maps/api';
const libraries = ['places', 'drawing'];
// Google Maps API Key - should be moved to environment variable in production
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBSojBslZCujSCQb8tNB5sxRWXwa6aO_Ec';
export default function useGoogleMapsLoader() {
    return useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });
}
