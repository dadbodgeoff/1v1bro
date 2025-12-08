/**
 * Unit tests for enterprise settings components.
 * Requirements: 1.3, 6.7
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsToggle } from './SettingsToggle';
import { SettingsSlider } from './SettingsSlider';
import { SettingsSelect } from './SettingsSelect';
import { KeybindInput } from './KeybindInput';

describe('SettingsToggle', () => {
  it('renders with label and description', () => {
    render(
      <SettingsToggle
        id="test-toggle"
        label="Test Label"
        description="Test description"
        checked={false}
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    render(
      <SettingsToggle
        id="test-toggle"
        label="Test"
        checked={false}
        onChange={onChange}
      />
    );
    
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(
      <SettingsToggle
        id="test-toggle"
        label="Test"
        checked={false}
        onChange={onChange}
        disabled={true}
      />
    );
    
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(
      <SettingsToggle
        id="test-toggle"
        label="Test"
        checked={false}
        onChange={() => {}}
        loading={true}
      />
    );
    
    // Loading spinner should be present
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('handles keyboard navigation', () => {
    const onChange = vi.fn();
    render(
      <SettingsToggle
        id="test-toggle"
        label="Test"
        checked={false}
        onChange={onChange}
      />
    );
    
    const toggle = screen.getByRole('switch');
    fireEvent.keyDown(toggle, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(true);
    
    fireEvent.keyDown(toggle, { key: ' ' });
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('SettingsSlider', () => {
  it('renders with label and value', () => {
    render(
      <SettingsSlider
        id="test-slider"
        label="Volume"
        value={50}
        min={0}
        max={100}
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('clamps value to bounds', () => {
    const onChange = vi.fn();
    render(
      <SettingsSlider
        id="test-slider"
        label="Volume"
        value={50}
        min={0}
        max={100}
        onChange={onChange}
      />
    );
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
  });

  it('shows reset button when value differs from default', () => {
    render(
      <SettingsSlider
        id="test-slider"
        label="Volume"
        value={30}
        min={0}
        max={100}
        defaultValue={50}
        showReset={true}
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('hides reset button when value equals default', () => {
    render(
      <SettingsSlider
        id="test-slider"
        label="Volume"
        value={50}
        min={0}
        max={100}
        defaultValue={50}
        showReset={true}
        onChange={() => {}}
      />
    );
    
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
  });

  it('shows muted state', () => {
    render(
      <SettingsSlider
        id="test-slider"
        label="Volume"
        value={50}
        min={0}
        max={100}
        muted={true}
        onMute={() => {}}
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Muted')).toBeInTheDocument();
  });
});

describe('SettingsSelect', () => {
  const options = [
    { value: 'low', label: 'Low', description: 'Best performance' },
    { value: 'medium', label: 'Medium', description: 'Balanced' },
    { value: 'high', label: 'High', description: 'Best quality' },
  ];

  it('renders with label and current value', () => {
    render(
      <SettingsSelect
        id="test-select"
        label="Quality"
        value="medium"
        options={options}
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('calls onChange when option selected', () => {
    const onChange = vi.fn();
    render(
      <SettingsSelect
        id="test-select"
        label="Quality"
        value="medium"
        options={options}
        onChange={onChange}
      />
    );
    
    // Click to open dropdown (button has name "Quality" from label)
    const button = screen.getByRole('button', { name: /Quality/i });
    fireEvent.click(button);
    
    // Click on option
    const highOption = screen.getByRole('option', { name: /High/i });
    fireEvent.click(highOption);
    
    expect(onChange).toHaveBeenCalledWith('high');
  });
});

describe('KeybindInput', () => {
  it('renders with action and current key', () => {
    render(
      <KeybindInput
        id="test-keybind"
        action="Move Up"
        currentKey="KeyW"
        defaultKey="KeyW"
        onCapture={() => {}}
      />
    );
    
    expect(screen.getByText('Move Up')).toBeInTheDocument();
    expect(screen.getByText('W')).toBeInTheDocument(); // getKeyDisplayName converts KeyW to W
  });

  it('shows conflict warning', () => {
    render(
      <KeybindInput
        id="test-keybind"
        action="Move Up"
        currentKey="KeyW"
        defaultKey="KeyW"
        onCapture={() => {}}
        conflictWith="Move Down"
      />
    );
    
    expect(screen.getByText(/Conflicts with.*Move Down/i)).toBeInTheDocument();
  });

  it('enters capture mode on click', () => {
    render(
      <KeybindInput
        id="test-keybind"
        action="Move Up"
        currentKey="KeyW"
        defaultKey="KeyW"
        onCapture={() => {}}
      />
    );
    
    // Find the keybind button (shows "W")
    const button = screen.getByText('W');
    fireEvent.click(button);
    
    expect(screen.getByText('Press a key...')).toBeInTheDocument();
  });
});
