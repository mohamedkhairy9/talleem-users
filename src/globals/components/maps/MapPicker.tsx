import React, { useCallback, useRef, useState } from 'react';
import {
    GoogleMap,
    Marker,
    Autocomplete
} from '@react-google-maps/api';
import { useTranslation } from 'react-i18next';
import useGoogleMapsLoader from './useGoogleMapsLoader';

const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '300px'
};

const defaultCenter = {
    lat: 30.0444,
    lng: 31.2357
};

interface MapPickerProps {
    onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
    oldLocation?: { lat: number; lng: number } | null;
    disabled?: boolean;
}

const MapPicker: React.FC<MapPickerProps> = ({
    onLocationSelect,
    oldLocation = null,
    disabled = false
}) => {
    const { t } = useTranslation();
    const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(oldLocation || null);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [searchValue, setSearchValue] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { isLoaded } = useGoogleMapsLoader();

    const onMapClick = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (disabled || !e.latLng) return;
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarker({ lat, lng });
            
            // Reverse geocode to get address
            if (window.google?.maps?.Geocoder) {
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        const address = results[0].formatted_address || '';
                        setSearchValue(address);
                        onLocationSelect({ lat, lng, address });
                    } else {
                        setSearchValue('');
                        onLocationSelect({ lat, lng, address: '' });
                    }
                });
            } else {
                onLocationSelect({ lat, lng, address: '' });
            }
        },
        [onLocationSelect, disabled]
    );

    const onLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteInstance);
    }, []);

    const onPlaceChanged = useCallback(() => {
        if (disabled || !autocomplete) return;

        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            console.log('No location available for this place');
            return;
        }
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || '';
        setMarker({ lat, lng });
        setSearchValue(address);
        onLocationSelect({ lat, lng, address });
    }, [autocomplete, onLocationSelect, disabled]);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[300px] bg-gray-100 rounded-lg">
                <p className="text-gray-600">{t('common.loading', 'Loading Map...')}</p>
            </div>
        );
    }

    const zoom = marker ? (disabled ? 15 : 12) : 6;

    return (
        <div className="map-picker-container">
            {!disabled && (
                <div
                    className="search-container mb-3"
                >
                    <Autocomplete
                        onLoad={onLoad}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <input
                            className="outline-none rounded-lg border border-gray-300 w-full p-2 focus:ring-2 focus:ring-primary focus:border-primary"
                            ref={searchInputRef}
                            type="text"
                            placeholder={t('common.search_location', 'Search for a location...')}
                            disabled={disabled}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </Autocomplete>
                </div>
            )}

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={marker || defaultCenter}
                zoom={zoom}
                onClick={onMapClick}
                options={{
                    draggable: !disabled,
                    zoomControl: true,
                    scrollwheel: true,
                    disableDoubleClickZoom: disabled,
                    gestureHandling: 'auto'
                }}
            >
                {marker && <Marker position={marker} />}
            </GoogleMap>
        </div>
    );
};

export default MapPicker;













