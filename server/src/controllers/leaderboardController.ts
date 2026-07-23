import { Request, Response } from 'express';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { ConvertedClient } from '../models/ConvertedClient';
import { DailyReport } from '../models/DailyReport';

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { timeframe = 'monthly' } = req.query;

    const callers = await User.find({ role: 'caller', isActive: true });

    let dateFilter: any = {};
    const now = new Date();

    if (timeframe === 'weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      dateFilter = { $gte: weekStart };
    } else if (timeframe === 'monthly') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { $gte: monthStart };
    } else if (timeframe === 'quarterly') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
      dateFilter = { $gte: quarterStart };
    } else if (timeframe === 'yearly') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      dateFilter = { $gte: yearStart };
    }

    const leaderboardData = await Promise.all(
      callers.map(async (caller) => {
        const clientQuery: any = {
          userId: caller._id,
          approvalStatus: 'Approved'
        };
        if (dateFilter.$gte) clientQuery.conversionDate = dateFilter;

        const leadQuery: any = { userId: caller._id };
        if (dateFilter.$gte) leadQuery.createdAt = dateFilter;

        const reportQuery: any = { userId: caller._id };

        const [approvedClients, totalLeads, dailyReports] = await Promise.all([
          ConvertedClient.find(clientQuery),
          Lead.countDocuments(leadQuery),
          DailyReport.find(reportQuery)
        ]);

        const approvedSales = approvedClients.length;
        const revenueGenerated = approvedClients.reduce((sum, c) => sum + (c.totalClientAmount || 0), 0);
        const paymentsCollected = approvedClients.reduce((sum, c) => sum + (c.clientPaidAmount || 0), 0);

        const totalCalls = dailyReports.reduce((sum, r) => sum + (r.totalCalls || 0), 0);
        const meetingsBooked = dailyReports.reduce((sum, r) => sum + (r.meetingsScheduled || 0), 0);
        const followUpsDone = dailyReports.reduce((sum, r) => sum + (r.followUpsDone || 0), 0);

        const conversionRate = totalLeads > 0 ? Number(((approvedSales / totalLeads) * 100).toFixed(1)) : 0;

        // Composite Score Calculation for Ranking
        const score = approvedSales * 100 + Math.floor(revenueGenerated / 1000) * 10 + totalCalls + meetingsBooked * 20;

        return {
          callerId: caller._id,
          callerName: caller.name,
          callerEmail: caller.email,
          approvedSales,
          revenueGenerated,
          paymentsCollected,
          totalCalls,
          meetingsBooked,
          followUpsDone,
          totalLeads,
          conversionRate,
          score
        };
      })
    );

    // Sort by Score / Approved Sales descending
    leaderboardData.sort((a, b) => b.score - a.score || b.approvedSales - a.approvedSales);

    // Assign Ranks & Top Caller Badges
    const rankedData = leaderboardData.map((item, index) => ({
      ...item,
      rank: index + 1,
      isTopOfWeek: index === 0 && timeframe === 'weekly',
      isTopOfMonth: index === 0 && timeframe === 'monthly'
    }));

    res.json({
      success: true,
      timeframe,
      topCallerOfWeek: rankedData.length > 0 ? rankedData[0].callerName : 'N/A',
      leaderboard: rankedData
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
