// src/services/firestoreService.js
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

class FirestoreService {
  
  // 🚌 Fetch all buses
  async getAllBuses() {
    try {
      const busesRef = collection(db, 'buses');
      const snapshot = await getDocs(busesRef);
      
      const buses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched buses from Firestore:', buses);
      return buses;
    } catch (error) {
      console.error('Error fetching buses:', error);
      throw new Error(`Failed to fetch buses: ${error.message}`);
    }
  }

  // 🔍 Search buses with filters
  async searchBuses(searchParams) {
    try {
      const { from, to, date } = searchParams;
      const busesRef = collection(db, 'buses');
      
      // Create query with filters
      let q = query(busesRef);
      
      // Add filters if provided
      if (from && to) {
        // Note: You might need to adjust this based on your data structure
        q = query(busesRef, orderBy('departure'));
      }
      
      const snapshot = await getDocs(q);
      const buses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Search results from Firestore:', buses);
      return buses;
    } catch (error) {
      console.error('Error searching buses:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // 🎫 Get single bus details
  async getBusById(busId) {
    try {
      const busRef = doc(db, 'buses', busId);
      const snapshot = await getDoc(busRef);
      
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      } else {
        throw new Error('Bus not found');
      }
    } catch (error) {
      console.error('Error fetching bus details:', error);
      throw new Error(`Failed to fetch bus details: ${error.message}`);
    }
  }

  // 📍 Get routes
  async getRoutes() {
    try {
      const routesRef = collection(db, 'routes');
      const snapshot = await getDocs(routesRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw new Error(`Failed to fetch routes: ${error.message}`);
    }
  }
}

export default new FirestoreService();
