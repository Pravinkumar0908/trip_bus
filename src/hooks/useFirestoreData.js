// src/hooks/useFirestoreData.js
import { useState, useEffect } from 'react';
import FirestoreService from '../services/firestoreService';

// Hook for fetching all buses
export const useBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true);
        const busData = await FirestoreService.getAllBuses();
        setBuses(busData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setBuses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  return { buses, loading, error };
};

// Hook for searching buses
export const useBusSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchBuses = async (searchParams) => {
    try {
      setLoading(true);
      setError(null);
      const buses = await FirestoreService.searchBuses(searchParams);
      setResults(buses);
      return buses;
    } catch (err) {
      setError(err.message);
      setResults([]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, searchBuses };
};
