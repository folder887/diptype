const FREE_LIMIT = Number(process.env.FREE_REQUEST_LIMIT || 3);

function isPro(user) {
  if (user.plan !== 'pro') return false;
  if (!user.plan_expires) return true;
  return Number(user.plan_expires) > Date.now();
}

function publicUser(user) {
  const pro = isPro(user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: pro ? 'pro' : 'free',
    planExpires: user.plan_expires || null,
    freeUsed: user.free_used,
    freeLimit: FREE_LIMIT,
    freeRemaining: Math.max(0, FREE_LIMIT - user.free_used),
    isPro: pro,
  };
}

module.exports = { publicUser, isPro, FREE_LIMIT };
