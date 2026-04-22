import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, UserPlus, LogIn, Loader2 } from 'lucide-react';
import {
  createFridgeInvite,
  joinFridgeByInvite,
} from '../../services/fridgeService';

function apiErr(e) {
  if (!e || typeof e !== 'object') return 'Something went wrong.';
  return e.message || e.error || 'Something went wrong.';
}

/**
 * @param {{ open: boolean, onClose: () => void, fridgeId: number | null, onJoined: () => void }} props
 */
const FridgeHouseholdModal = ({ open, onClose, fridgeId, onJoined }) => {
  const [tab, setTab] = useState('invite');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [copied, setCopied] = useState(false);

  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setInviteError('');
    setJoinError('');
    setJoinSuccess('');
    setInviteCode('');
    setJoinCode('');
    setCopied(false);
    setTab('invite');
  }, [open]);

  if (!open) return null;

  const fid = fridgeId != null && Number.isFinite(Number(fridgeId)) ? Number(fridgeId) : null;

  const handleCreateInvite = async () => {
    if (fid == null) {
      setInviteError('Could not determine your fridge. Reload the page and try again.');
      return;
    }
    setInviteLoading(true);
    setInviteError('');
    setInviteCode('');
    try {
      const res = await createFridgeInvite(fid);
      const code = res?.data?.invite_code;
      if (res?.status === 'OK' && code) {
        setInviteCode(String(code));
      } else {
        setInviteError(res?.message || 'Could not create invite.');
      }
    } catch (e) {
      setInviteError(apiErr(e));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setInviteError('Could not copy to clipboard.');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const raw = joinCode.trim();
    if (!raw) {
      setJoinError('Enter an invite code.');
      return;
    }
    setJoinLoading(true);
    setJoinError('');
    setJoinSuccess('');
    try {
      const res = await joinFridgeByInvite({ invite_code: raw });
      if (res?.status === 'OK') {
        const newId = res?.data?.fridge_id;
        if (newId != null) {
          localStorage.setItem('fridgeId', String(newId));
        }
        setJoinSuccess('You joined this fridge. Your inventory will update.');
        onJoined?.();
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setJoinError(res?.message || 'Could not join.');
      }
    } catch (e) {
      setJoinError(apiErr(e));
    } finally {
      setJoinLoading(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="household-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-[101] flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-black/10 bg-[#F7F7F2] shadow-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/8 bg-white/90 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark/45">
              Household
            </p>
            <h2
              id="household-modal-title"
              className="mt-1 text-lg font-black uppercase italic tracking-tight text-brand-dark"
            >
              Add / join fridge
            </h2>
            <p className="mt-1 text-xs text-brand-dark/55">
              Share your fridge with someone, or join theirs with a code.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-black/10 bg-white p-2 text-brand-dark hover:bg-black/5"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex rounded-full border border-black/10 bg-white/80 p-1">
            <button
              type="button"
              onClick={() => setTab('invite')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                tab === 'invite'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-brand-dark/60 hover:text-brand-dark'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite
            </button>
            <button
              type="button"
              onClick={() => setTab('join')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                tab === 'join'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-brand-dark/60 hover:text-brand-dark'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Join
            </button>
          </div>

          {tab === 'invite' && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-brand-dark/80">
                Create a one-time code and send it to the person you want on this fridge. Codes expire
                in about 24 hours.
              </p>
              {inviteError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                  {inviteError}
                </p>
              )}
              <button
                type="button"
                onClick={handleCreateInvite}
                disabled={inviteLoading || fid == null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-dark py-3 text-sm font-semibold uppercase tracking-wide text-brand-beige hover:bg-brand-dark/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inviteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Generate invite code
              </button>
              {fid == null && (
                <p className="text-xs text-amber-800">
                  Sign in and load your fridge first so we know which fridge to invite to.
                </p>
              )}
              {inviteCode && (
                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-dark/45">
                    Your code
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded-lg bg-black/5 px-3 py-2 font-mono text-sm text-brand-dark">
                      {inviteCode}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="shrink-0 rounded-full border border-black/10 bg-[#F7F7F2] p-2 text-brand-dark hover:bg-black/5"
                      aria-label="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {copied && (
                    <p className="mt-2 text-xs font-medium text-brand-green">Copied to clipboard.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'join' && (
            <form className="mt-5 space-y-4" onSubmit={handleJoin}>
              <p className="text-sm text-brand-dark/80">
                Enter the invite code you received. Joining moves you to that shared fridge (your
                current solo fridge is left behind if empty).
              </p>
              {joinError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                  {joinError}
                </p>
              )}
              {joinSuccess && (
                <p className="rounded-lg border border-brand-green/30 bg-brand-green/10 px-3 py-2 text-sm text-brand-dark">
                  {joinSuccess}
                </p>
              )}
              <div>
                <label htmlFor="join-invite-code" className="sr-only">
                  Invite code
                </label>
                <input
                  id="join-invite-code"
                  type="text"
                  autoComplete="off"
                  placeholder="Paste invite code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-sm text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-green/50 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                />
              </div>
              <button
                type="submit"
                disabled={joinLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-green py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {joinLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Join fridge
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default FridgeHouseholdModal;
