import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import colors from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  testID?: string;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  testID,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  {title && <Text style={styles.title}>{title}</Text>}
                  {showCloseButton && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={styles.content}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  modal: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 20,
    color: colors.text.disabled,
  },
  content: {
    padding: spacing.xl,
  },
});

export default Modal;
