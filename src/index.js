@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  direction: rtl;
  font-family: 'Noto Sans Arabic', sans-serif;
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
