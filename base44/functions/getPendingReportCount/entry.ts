import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ count: 0 });
    }
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return Response.json({ count: 0 });
    }

    const reports = await base44.asServiceRole.entities.Report.filter({ status: 'pending' });
    return Response.json({ count: reports.length });
  } catch (error) {
    return Response.json({ count: 0 });
  }
});