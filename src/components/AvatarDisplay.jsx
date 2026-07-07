import React from 'react';

export default function AvatarDisplay({ avatar, size = '1em', style = {} }) {
  if (!avatar) return <span>⭐</span>;
  
  if (avatar.startsWith('data:image')) {
    return (
      <img 
        src={avatar} 
        alt="avatar" 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          objectFit: 'cover', 
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style 
        }} 
      />
    );
  }
  
  return <span style={{ ...style, fontSize: size, display: 'inline-block', verticalAlign: 'middle' }}>{avatar}</span>;
}
