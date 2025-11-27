import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Modal from '../../src/components/common/Modal';
import { Text } from 'react-native';

describe('Modal', () => {
  it('renders correctly when visible', () => {
    const { getByText } = render(
      <Modal visible={true} onClose={() => {}} title="Test Modal">
        <Text>Modal Content</Text>
      </Modal>
    );
    expect(getByText('Test Modal')).toBeTruthy();
    expect(getByText('Modal Content')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <Modal visible={false} onClose={() => {}}>
        <Text>Hidden Content</Text>
      </Modal>
    );
    expect(queryByText('Hidden Content')).toBeNull();
  });

  it('shows close button by default', () => {
    const { getByText } = render(
      <Modal visible={true} onClose={() => {}} title="Modal with Close">
        <Text>Content</Text>
      </Modal>
    );
    expect(getByText('✕')).toBeTruthy();
  });

  it('hides close button when showCloseButton is false', () => {
    const { queryByText } = render(
      <Modal visible={true} onClose={() => {}} title="Modal" showCloseButton={false}>
        <Text>Content</Text>
      </Modal>
    );
    expect(queryByText('✕')).toBeNull();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <Modal visible={true} onClose={onClose} title="Modal">
        <Text>Content</Text>
      </Modal>
    );
    fireEvent.press(getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
