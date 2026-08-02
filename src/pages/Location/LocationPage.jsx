import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import PostCard from '../../components/PostCard/PostCard';
import PostSkeleton from '../../components/Loader/PostSkeleton';
import Spinner from '../../components/Loader/Spinner';
import postService from '../../services/postService';
import './LocationPage.css';

const LocationPage = () => {
  const { placeId } = useParams();
  const routerLocation = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationDetails, setLocationDetails] = useState(routerLocation.state?.location || null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Fetch posts and resolve location details if not passed via state
  useEffect(() => {
    const fetchLocationData = async () => {
      setLoading(true);
      try {
        const res = await postService.getPostsByLocation(placeId);
        if (res.success) {
          setPosts(res.data);
          
          // If location details weren't in state, extract from the first post that has it
          if (!locationDetails && res.data.length > 0) {
            const postWithLoc = res.data.find(p => p.location && p.location.placeId === placeId);
            if (postWithLoc) {
              setLocationDetails(postWithLoc.location);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching location posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [placeId, locationDetails]);

  // Map Initialization & Cleanup
  useEffect(() => {
    if (!locationDetails || !mapRef.current) return;

    // Wait for Leaflet global to be loaded just in case of lazy imports
    if (!window.L) {
      console.warn('Leaflet global object not found');
      return;
    }

    const { latitude, longitude, name, address } = locationDetails;
    
    // Destroy previous map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = window.L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([latitude, longitude], 13);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Custom Pin Marker Icon styling
      const marker = window.L.marker([latitude, longitude]).addTo(map);
      marker.bindPopup(`<b>${name}</b><br/><span style="font-size:0.8rem; color:#555;">${address || ''}</span>`).openPopup();

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Failed to initialize Leaflet map:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locationDetails]);

  return (
    <Layout>
      <div className="location-page-container">
        {locationDetails && (
          <div className="card location-header-card animate-fade-in">
            <div className="location-header-info">
              <span className="location-header-icon">📍</span>
              <div style={{ textAlign: 'left' }}>
                <h2 className="location-title">{locationDetails.name}</h2>
                <p className="location-address">{locationDetails.address}</p>
                {locationDetails.city && (
                  <span className="location-meta-tag">
                    {locationDetails.city}{locationDetails.country ? `, ${locationDetails.country}` : ''}
                  </span>
                )}
              </div>
            </div>
            
            {/* Interactive Map Container */}
            <div className="location-map-wrapper">
              <div ref={mapRef} className="leaflet-map-container" id="location-map"></div>
            </div>
          </div>
        )}

        <div className="feed-header" style={{ marginTop: '24px' }}>
          <h3 className="feed-title">Posts from this location</h3>
        </div>

        <div className="location-posts-feed">
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : posts.length === 0 ? (
            <div className="card no-posts-location">
              <div className="no-posts-icon">📍</div>
              <h3>No Posts Yet</h3>
              <p>Be the first to share a post at {locationDetails?.name || 'this location'}!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LocationPage;
