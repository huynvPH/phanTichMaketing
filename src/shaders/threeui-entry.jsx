import React from 'react';
import { TopologyField } from './neuform-isolated/NeuformIsolatedEffects';

export function StructureFlowCollection({
  variant = 'topology-field',
  hue = 0,
  saturation = 1.0,
  brightness = 1.0,
  className = '',
  style = {},
  ...props
}) {
  if (variant === 'topology-field') {
    return (
      <TopologyField
        hue={hue}
        saturation={saturation}
        brightness={brightness}
        className={className}
        style={style}
        {...props}
      />
    );
  }

  return (
    <TopologyField
      hue={hue}
      saturation={saturation}
      brightness={brightness}
      className={className}
      style={style}
      {...props}
    />
  );
}

export { TopologyField };
