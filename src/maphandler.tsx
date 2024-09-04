import { Marker, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect } from "react";

interface MapHandlerProps {
  place: google.maps.places.PlaceResult | null;
  latitude: number;
  longitude: number;
}

const MapHandler = ({ place, latitude, longitude }: MapHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    if (latitude !== 0) {
      console.log("set");
      map?.setCenter({ lat: latitude, lng: longitude });
    }
    if (!map || !place) return;

    if (place.geometry?.viewport) {
      map.fitBounds(place.geometry?.viewport);
    } else {
      map.setCenter({ lat: latitude, lng: longitude });
    }
  }, [map, place, latitude, longitude]);

  return (
    <Marker
      position={{
        lat: place?.geometry?.location?.lat() || latitude,
        lng: place?.geometry?.location?.lng() || longitude,
      }}
    />
  );
};

export default React.memo(MapHandler);
