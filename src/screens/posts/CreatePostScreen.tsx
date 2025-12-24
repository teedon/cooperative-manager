import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Image as ImageIcon, X, Send, Megaphone } from 'lucide-react-native';
import * as ImagePicker from 'react-native-image-picker';
import { CooperativeStackParamList, PostType } from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createPost } from '../../store/slices/postsSlice';
import Button from '../../components/common/Button';
import colors from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type CreatePostScreenNavigationProp = NativeStackNavigationProp<
  CooperativeStackParamList,
  'CreatePost'
>;
type CreatePostScreenRouteProp = RouteProp<CooperativeStackParamList, 'CreatePost'>;

interface Props {
  navigation: CreatePostScreenNavigationProp;
  route: CreatePostScreenRouteProp;
}

const CreatePostScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  const handleSelectImage = useCallback(() => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to select image');
          return;
        }
        if (response.assets && response.assets[0]?.uri) {
          setImageUri(response.assets[0].uri);
        }
      },
    );
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageUri(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      // TODO: If imageUri exists, upload to storage first and get URL
      // For now, we'll just send the post without the image URL
      const postData = {
        cooperativeId,
        title: title.trim() || undefined,
        content: content.trim(),
        imageUrl: imageUri || undefined, // This should be the uploaded URL
        postType: isAnnouncement ? 'announcement' as PostType : 'member_post' as PostType,
      };

      await dispatch(createPost(postData)).unwrap();
      Alert.alert('Success', 'Post created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, cooperativeId, title, content, imageUri, isAnnouncement, dispatch, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Post Type Toggle */}
        <View style={styles.postTypeContainer}>
          <TouchableOpacity
            style={[
              styles.postTypeButton,
              !isAnnouncement && styles.postTypeButtonActive,
            ]}
            onPress={() => setIsAnnouncement(false)}
          >
            <Text
              style={[
                styles.postTypeText,
                !isAnnouncement && styles.postTypeTextActive,
              ]}
            >
              Regular Post
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postTypeButton,
              isAnnouncement && styles.postTypeButtonActive,
            ]}
            onPress={() => setIsAnnouncement(true)}
          >
            <Megaphone
              size={16}
              color={isAnnouncement ? colors.common.white : colors.text.secondary}
              style={{ marginRight: spacing.xs }}
            />
            <Text
              style={[
                styles.postTypeText,
                isAnnouncement && styles.postTypeTextActive,
              ]}
            >
              Announcement
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title Input (Optional) */}
        <TextInput
          style={styles.titleInput}
          placeholder="Add a title (optional)"
          placeholderTextColor={colors.text.disabled}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Content Input */}
        <TextInput
          style={styles.contentInput}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.text.disabled}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />

        {/* Character Count */}
        <Text style={styles.charCount}>{content.length}/2000</Text>

        {/* Selected Image Preview */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
              <X size={20} color={colors.common.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Add Image Button */}
        {!imageUri && (
          <TouchableOpacity style={styles.addImageButton} onPress={handleSelectImage}>
            <ImageIcon size={24} color={colors.primary.main} />
            <Text style={styles.addImageText}>Add Image</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          title={isSubmitting ? 'Posting...' : 'Post'}
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={styles.submitButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  postTypeContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  postTypeButtonActive: {
    backgroundColor: colors.primary.main,
  },
  postTypeText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  postTypeTextActive: {
    color: colors.common.white,
  },
  titleInput: {
    ...typography.h3,
    color: colors.text.primary,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  contentInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 200,
    ...shadows.sm,
  },
  charCount: {
    ...typography.bodySmall,
    color: colors.text.disabled,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  imagePreviewContainer: {
    marginTop: spacing.md,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: spacing.xs,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
  },
  addImageText: {
    ...typography.body,
    color: colors.primary.main,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  submitButton: {
    width: '100%',
  },
});

export default CreatePostScreen;
