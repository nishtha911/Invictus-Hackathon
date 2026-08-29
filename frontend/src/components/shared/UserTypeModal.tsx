export function UserTypeModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Start AI Advisory</h2>
        <div className="space-y-3">
          <button onClick={onClose} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium">Continue as Guest</button>
          <button onClick={onClose} className="w-full py-2 bg-slate-100 text-slate-800 rounded-lg font-medium">I&apos;m an Existing Customer</button>
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-slate-500">Cancel</button>
      </div>
    </div>
  );
}
