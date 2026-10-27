import React, { useState } from 'react';
import TextType from './TextType';
import './randombgtext.css';

const CODE_LINES = [
  'const [state, setState] = useState(init);',
  'useEffect(() => { mount(); return clean; }, []);',
  "await fetch('/api/v1/auth/session')",
  'export default async function ServerComponent()',
  'Object.keys(nodes).map(key => nodes[key].id)',
  'const pipeline = (...fns) => (x) => fns.reduce((v, f) => f(v), x);',
  'window.requestAnimationFrame(step);',
  'sudo systemctl restart nginx.service',
  'chmod +x ./deploy_prod.sh',
  'docker-compose up --build -d',
  "git commit -m 'fix: resolve race condition'",
  'npm run build --minify --target=esnext',
  'go run ./cmd/server --port=8080',
  '0x7FFF + (delta & 0xFF)',
  'this.velocity.add(this.acceleration);',
  'O(n log n) // QuickSort Average Case',
];

function buildElements() {
  const count = window.innerWidth < 700 ? 6 : 12;

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    phrases: [...CODE_LINES].sort(() => Math.random() - 0.5),
    accent: i % 4 === 0,
    style: {
      top: `${Math.floor(Math.random() * 80) + 10}%`,
      left: `${Math.floor(Math.random() * 60) + 3}%`,
      fontSize: `${Math.floor(Math.random() * 6) + 12}px`,
      opacity: Math.random() * 0.06 + 0.08,
    },
  }));
}

export default function BackgroundText() {
  const [items] = useState(buildElements);

  return (
    <div className="text-background-layer" aria-hidden="true">
      {items.map((item) => (
        <div
          key={item.id}
          className={`random-bg-code-wrapper ${item.accent ? 'is-accent' : ''}`}
          style={item.style}
        >
          <TextType
            text={item.phrases}
            typingSpeed={50}
            pauseDuration={1500}
            deletingSpeed={80}
            deleteMode="backspace"
            typeEffect="fade"
            mistakes={0}
            cursorStyle="underscore"
            cursorGlide
            showCursor
            variableSpeed
            cursorColor="currentColor"
            cursorBlinkDuration={0.5}
            cursorCharacter="_"
            prefix=""
          />
        </div>
      ))}
    </div>
  );
}