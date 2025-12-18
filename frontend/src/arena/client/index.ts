/**
 * Client Systems - Layer 4
 *
 * Client-side systems for input handling, prediction, interpolation, and camera control.
 */

export {
  InputManager,
  type IInputManager,
  type InputConfig,
  type RawInput,
  DEFAULT_INPUT_CONFIG,
} from './InputManager';

export {
  CameraController,
  type ICameraController,
  type CameraConfig,
  type CameraState,
  DEFAULT_CAMERA_CONFIG,
} from './CameraController';

export {
  PredictionSystem,
  type IPredictionSystem,
  type PredictionConfig,
  DEFAULT_PREDICTION_CONFIG,
} from './PredictionSystem';

export {
  InterpolationBuffer,
  type IInterpolationBuffer,
  type InterpolationConfig,
  type InterpolatedEntity,
  DEFAULT_INTERPOLATION_CONFIG,
} from './InterpolationBuffer';
