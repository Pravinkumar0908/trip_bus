import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

const BusImages = () => {
  const [operators, setOperators] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [images, setImages] = useState({});
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Cloudinary Configuration
  const CLOUD_NAME = 'dynzrbflv';
  const UPLOAD_PRESET = 'buses_upload';

  // Fetch operators
  const fetchOperators = async () => {
    try {
      setLoading(true);
      setStatus('Loading operators...');
      
      const operatorsRef = collection(db, 'operators');
      const snapshot = await getDocs(operatorsRef);
      
      const operatorsData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        operatorsData.push({
          id: doc.id,
          operatorId: data.operatorId,
          fullName: data.fullName,
          businessName: data.businessName,
          emailAddress: data.emailAddress,
          mobileNumber: data.mobileNumber,
          status: data.status,
          isActive: data.isActive,
          ...data
        });
      });
      
      const activeOperators = operatorsData.filter(op => 
        op.status === 'approved' && op.isActive !== false
      );
      
      setOperators(activeOperators.length > 0 ? activeOperators : operatorsData);
      setStatus(`${operatorsData.length} operators loaded successfully`);
      
    } catch (error) {
      setStatus('Error loading operators');
    } finally {
      setLoading(false);
    }
  };

  // Fetch buses for operator
  const fetchBusesForOperator = async (selectedOperatorData) => {
    try {
      setLoading(true);
      setStatus(`Loading buses for ${selectedOperatorData.fullName}...`);
      
      const searchIds = [
        selectedOperatorData.operatorId,
        selectedOperatorData.id,
        selectedOperatorData.fullName,
        selectedOperatorData.businessName
      ].filter(Boolean);
      
      let allBuses = [];
      
      for (const searchId of searchIds) {
        try {
          const busesRef = collection(db, 'buses');
          const q = query(busesRef, where('operatorId', '==', searchId));
          const snapshot = await getDocs(q);
          
          snapshot.forEach((doc) => {
            const busData = { id: doc.id, ...doc.data() };
            if (!allBuses.find(b => b.id === busData.id)) {
              allBuses.push(busData);
            }
          });
          
          if (allBuses.length > 0) break;
        } catch (error) {
          continue;
        }
      }
      
      setBuses(allBuses);
      setStatus(`Found ${allBuses.length} buses`);
      
    } catch (error) {
      setStatus('Error loading buses');
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle operator selection
  const handleOperatorChange = (operatorId) => {
    setSelectedOperator(operatorId);
    setSelectedBus(null);
    setBuses([]);
    
    if (!operatorId) return;
    
    const operatorData = operators.find(op => op.id === operatorId);
    if (operatorData) {
      fetchBusesForOperator(operatorData);
    }
  };

  // Select bus
  const selectBus = (bus) => {
    setSelectedBus(bus);
    setImages({});
    setStatus(`Selected: ${bus.busNumber || bus.busId || 'Bus'}`);
  };

  // Handle image selection
  const handleImageSelect = (field, file) => {
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }
    
    setImages(prev => ({ ...prev, [field]: file }));
  };

  // Upload to Cloudinary
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', `buses/${selectedBus.busId || selectedBus.id}`);
    formData.append('quality', 'auto:good');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  // Save images
  const saveImages = async () => {
    if (!selectedBus) {
      alert('Please select a bus first');
      return;
    }

    const selectedImages = Object.entries(images).filter(([key, file]) => file !== null);
    
    if (selectedImages.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls = {};
      
      for (let i = 0; i < selectedImages.length; i++) {
        const [field, file] = selectedImages[i];
        setStatus(`Uploading ${field}... (${i + 1}/${selectedImages.length})`);
        uploadedUrls[field] = await uploadImage(file);
      }

      setStatus('Saving to database...');
      
      await updateDoc(doc(db, 'buses', selectedBus.id), {
        images: uploadedUrls,
        updatedAt: new Date(),
        lastImageUpdate: new Date().toISOString()
      });

      setStatus(`Successfully uploaded ${selectedImages.length} images!`);
      setImages({});
      
      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
      });

      setTimeout(() => setStatus(''), 5000);

    } catch (error) {
      setStatus('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h1 style={{ 
            fontSize: '3rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 15px 0',
            letterSpacing: '-1px'
          }}>
            🚌 Bus Image Management
          </h1>
          <p style={{ 
            fontSize: '1.2rem',
            color: '#64748b',
            margin: '0',
            fontWeight: '400'
          }}>
            Professional Image Upload System
          </p>
        </div>

        {/* Main Content */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Status Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '30px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              fontSize: '15px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏢</div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>Operators</div>
                <div style={{ color: '#64748b' }}>{operators.length}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚌</div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>Buses</div>
                <div style={{ color: '#64748b' }}>{buses.length}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📡</div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>Status</div>
                <div style={{ color: loading ? '#f59e0b' : '#10b981' }}>
                  {loading ? 'Loading...' : 'Connected'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>☁️</div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>Storage</div>
                <div style={{ color: '#10b981' }}>Ready</div>
              </div>
            </div>
          </div>

          {/* Operator Selection */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Select Operator
            </label>
            <select 
              value={selectedOperator}
              onChange={(e) => handleOperatorChange(e.target.value)}
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                fontSize: '16px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                backgroundColor: 'white',
                color: '#1e293b',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">Choose an operator...</option>
              {operators.map((op) => {
                const displayName = op.fullName || op.businessName || `Operator ${op.id}`;
                const contactInfo = op.emailAddress || op.mobileNumber || op.operatorId;
                
                return (
                  <option key={op.id} value={op.id}>
                    {displayName} - {contactInfo}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Buses Grid */}
          {selectedOperator && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '3px solid #667eea'
              }}>
                Available Buses ({buses.length})
              </h3>
              
              {loading ? (
                <div style={{
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '30px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  fontSize: '16px'
                }}>
                  Loading buses...
                </div>
              ) : buses.length === 0 ? (
                <div style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '30px',
                  borderRadius: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🚫</div>
                  <h4 style={{ margin: '0 0 10px 0' }}>No buses found</h4>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    No buses are associated with the selected operator
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '20px'
                }}>
                  {buses.map(bus => (
                    <div
                      key={bus.id}
                      onClick={() => selectBus(bus)}
                      style={{
                        background: selectedBus?.id === bus.id 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                          : 'white',
                        color: selectedBus?.id === bus.id ? 'white' : '#1e293b',
                        border: '2px solid',
                        borderColor: selectedBus?.id === bus.id ? '#667eea' : '#e2e8f0',
                        padding: '25px',
                        borderRadius: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: selectedBus?.id === bus.id 
                          ? '0 15px 35px rgba(102, 126, 234, 0.3)' 
                          : '0 5px 15px rgba(0,0,0,0.08)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '15px'
                      }}>
                        <h4 style={{ 
                          margin: '0', 
                          fontSize: '1.3rem',
                          fontWeight: '600'
                        }}>
                          {bus.busNumber || bus.busId || 'Bus ID: ' + bus.id}
                        </h4>
                        {selectedBus?.id === bus.id && (
                          <span style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backdropFilter: 'blur(10px)'
                          }}>
                            SELECTED
                          </span>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '14px', lineHeight: '1.6', opacity: '0.9' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Operator:</strong> {bus.operator || 'N/A'} | <strong>Type:</strong> {bus.type || 'N/A'}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Route:</strong> {bus.route?.from || 'N/A'} → {bus.route?.to || 'N/A'}
                        </div>
                        <div>
                          <strong>Seats:</strong> {bus.totalSeats || 'N/A'} | <strong>Price:</strong> ₹{bus.price || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Image Upload Section */}
          {selectedBus && (
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              padding: '40px',
              color: 'white'
            }}>
              <h3 style={{ 
                textAlign: 'center',
                fontSize: '1.8rem',
                fontWeight: '600',
                margin: '0 0 30px 0'
              }}>
                Upload Images for: {selectedBus.busNumber || selectedBus.busId || 'Selected Bus'}
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '25px',
                marginBottom: '40px'
              }}>
                {[
                  { key: 'exteriorFrontUrl', label: '🚌 Front Exterior', icon: '🚌', required: true },
                  { key: 'exteriorSideUrl', label: '🚌 Side Exterior', icon: '🚌', required: true },
                  { key: 'interiorMainUrl', label: '🪑 Interior Main', icon: '🪑', required: false },
                  { key: 'interiorSleeperUrl', label: '🛏️ Sleeper Area', icon: '🛏️', required: false },
                  { key: 'seatLayoutUrl', label: '📋 Seat Layout', icon: '📋', required: false },
                  { key: 'entryDoorUrl', label: '🚪 Entry Door', icon: '🚪', required: false },
                  { key: 'luggageAreaUrl', label: '🧳 Luggage Area', icon: '🧳', required: false }
                ].map(({ key, label, icon, required }) => (
                  <div key={key} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    padding: '25px',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '600', 
                      marginBottom: '12px',
                      fontSize: '16px',
                      color: required ? '#fbbf24' : 'white'
                    }}>
                      <span style={{ fontSize: '20px', marginRight: '8px' }}>{icon}</span>
                      {label} {required && <span style={{ color: '#fbbf24' }}>*</span>}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(key, e.target.files[0])}
                      style={{ 
                        width: '100%', 
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#1e293b',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                    {images[key] && (
                      <div style={{ 
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#bbf7d0',
                        wordBreak: 'break-all'
                      }}>
                        ✅ {images[key].name} ({(images[key].size / 1024 / 1024).toFixed(2)}MB)
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={saveImages}
                disabled={uploading || Object.keys(images).length === 0}
                style={{
                  width: '100%',
                  padding: '20px',
                  backgroundColor: uploading ? 'rgba(107, 114, 128, 0.8)' : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '15px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.5px'
                }}
              >
                {uploading ? '⏳ Processing Images...' : '🚀 Upload & Save Images'}
              </button>
            </div>
          )}

          {/* Status Display */}
          {status && (
            <div style={{
              marginTop: '30px',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '16px',
              backgroundColor: status.includes('Error') || status.includes('failed') ? '#fee2e2' : 
                             status.includes('Successfully') || status.includes('uploaded') ? '#dcfce7' : '#eff6ff',
              color: status.includes('Error') || status.includes('failed') ? '#991b1b' : 
                     status.includes('Successfully') || status.includes('uploaded') ? '#166534' : '#1e40af',
              border: '2px solid',
              borderColor: status.includes('Error') || status.includes('failed') ? '#fecaca' : 
                          status.includes('Successfully') || status.includes('uploaded') ? '#bbf7d0' : '#bfdbfe'
            }}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusImages;
