import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Pdf from 'react-native-pdf';
import { 
  isImageFile, 
  isPdfFile, 
  validateDocumentForPreview, 
  formatFileSize,
  getDocumentType 
} from '../../utils/documentPreview';

interface PreviewDocument {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

const DocumentPreviewDemo: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<PreviewDocument | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf, 
          DocumentPicker.types.images,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
        ],
      });

      if (result && result.length > 0) {
        const doc = result[0];
        
        // Validate the selected document
        const validation = validateDocumentForPreview(doc.name || '', doc.size || undefined);
        if (!validation.valid) {
          Alert.alert('Invalid Document', validation.error);
          return;
        }
        
        const previewDoc: PreviewDocument = {
          uri: doc.uri,
          name: doc.name || 'document',
          mimeType: doc.type || undefined,
          size: doc.size || undefined,
        };

        setSelectedDocument(previewDoc);
        Alert.alert('Document Selected', `${previewDoc.name} is ready for preview`);
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Document picker error:', err);
        Alert.alert('Error', 'Failed to pick document. Please try again.');
      }
    }
  };

  const openPreview = () => {
    if (selectedDocument) {
      setShowPreviewModal(true);
    }
  };

  const closePreview = () => {
    setShowPreviewModal(false);
  };

  const removeDocument = () => {
    setSelectedDocument(null);
  };

  const documentType = selectedDocument ? 
    getDocumentType(selectedDocument.mimeType, selectedDocument.name) : null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Document Preview Demo</Text>
          <Text style={styles.subtitle}>
            Test image and PDF preview functionality
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Document</Text>
          <TouchableOpacity style={styles.selectButton} onPress={pickDocument}>
            <Text style={styles.selectButtonText}>📎 Choose File</Text>
          </TouchableOpacity>
        </View>

        {selectedDocument && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Document</Text>
            <View style={styles.documentCard}>
              <View style={styles.documentPreview}>
                {/* Preview thumbnail */}
                {documentType === 'image' ? (
                  <TouchableOpacity 
                    style={styles.previewThumbnail}
                    onPress={openPreview}
                  >
                    <Image 
                      source={{ uri: selectedDocument.uri }} 
                      style={styles.thumbnailImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.previewOverlay}>
                      <Text style={styles.previewText}>👁️</Text>
                    </View>
                  </TouchableOpacity>
                ) : documentType === 'pdf' ? (
                  <TouchableOpacity 
                    style={styles.previewThumbnail}
                    onPress={openPreview}
                  >
                    <View style={styles.pdfThumbnail}>
                      <Text style={styles.pdfIcon}>📄</Text>
                      <Text style={styles.pdfLabel}>PDF</Text>
                    </View>
                    <View style={styles.previewOverlay}>
                      <Text style={styles.previewText}>👁️</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.previewThumbnail}>
                    <View style={styles.docThumbnail}>
                      <Text style={styles.docIcon}>📋</Text>
                      <Text style={styles.docLabel}>DOC</Text>
                    </View>
                  </View>
                )}
                
                {/* Document info */}
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={2}>
                    {selectedDocument.name}
                  </Text>
                  {selectedDocument.size && (
                    <Text style={styles.documentSize}>
                      {formatFileSize(selectedDocument.size)}
                    </Text>
                  )}
                  <Text style={styles.documentType}>
                    Type: {documentType?.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.documentActions}>
                <TouchableOpacity style={styles.previewButton} onPress={openPreview}>
                  <Text style={styles.previewButtonText}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeButton} onPress={removeDocument}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Document Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={closePreview}
      >
        <View style={styles.previewModalContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={closePreview} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {selectedDocument?.name}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.previewContent}>
            {selectedDocument && documentType === 'image' ? (
              <ScrollView 
                style={styles.imagePreviewContainer}
                contentContainerStyle={styles.imagePreviewContent}
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                <Image
                  source={{ uri: selectedDocument.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                  onError={() => Alert.alert('Error', 'Failed to load image')}
                />
              </ScrollView>
            ) : selectedDocument && documentType === 'pdf' ? (
              <Pdf
                source={{ uri: selectedDocument.uri, cache: true }}
                onLoadComplete={(numberOfPages) => {
                  console.log(`PDF loaded: ${numberOfPages} pages`);
                }}
                onError={(error) => {
                  console.error('PDF Error:', error);
                  Alert.alert('Error', 'Unable to load PDF document');
                }}
                style={styles.pdfPreview}
              />
            ) : (
              <View style={styles.unsupportedPreview}>
                <Text style={styles.unsupportedIcon}>📄</Text>
                <Text style={styles.unsupportedText}>
                  This file type cannot be previewed
                </Text>
                <Text style={styles.unsupportedSubtext}>
                  File: {selectedDocument?.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  documentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  pdfThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dc2626',
  },
  pdfIcon: {
    fontSize: 24,
    color: 'white',
  },
  pdfLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 4,
  },
  docThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6b7280',
  },
  docIcon: {
    fontSize: 24,
    color: 'white',
  },
  docLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 4,
  },
  previewOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    color: 'white',
    fontSize: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#8b7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  previewButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Preview Modal styles
  previewModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#8b5cf6',
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  previewTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 12,
  },
  placeholder: {
    width: 60,
  },
  previewContent: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  imagePreviewContainer: {
    flex: 1,
  },
  imagePreviewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: Dimensions.get('window').width - 32,
    height: Dimensions.get('window').height - 150,
  },
  pdfPreview: {
    flex: 1,
    backgroundColor: 'white',
  },
  unsupportedPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  unsupportedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  unsupportedSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default DocumentPreviewDemo;