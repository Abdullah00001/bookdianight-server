# Admin Dashboard API Implementation Plan

## 1. Overview
The Admin Dashboard requires an API endpoint to fetch high-level statistics and charting data. This endpoint will be accessible only by an authenticated administrator.

**Target Route:**
`GET /api/v1/admin/dashboard`

**Required Data Payload:**
1. **Total Earnings:** Sum of the platform's revenue (e.g., `commissionAmount` + `serviceChargeAmount`) from all `PAID` orders.
2. **Total Users:** Count of all registered users with the `USER` role.
3. **Total Club Owners:** Count of all registered users with the `CLUB_OWNER` role.
4. **User Management Chart Data:** A monthly breakdown of new user registrations for a specific year (defaulting to the current year).

## 2. API Schema Definition
Location: `server/src/app/modules/admin/admin.schema.ts`

```typescript
import { z } from 'zod';

export const getDashboardQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Invalid year format').optional(),
});

export type TGetDashboardQuery = z.infer<typeof getDashboardQuerySchema>;
```

## 3. Controller Implementation
Location: `server/src/app/modules/admin/admin.controllers.ts`

```typescript
export const getAdminDashboardController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const query = req.query as TGetDashboardQuery;
    
    const dashboardData = await getAdminDashboardService({ query });

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData,
      traceId,
    });
  }
);
```

## 4. Service Implementation
Location: `server/src/app/modules/admin/admin.services.ts`

```typescript
export const getAdminDashboardService = async ({
  query,
}: {
  query: TGetDashboardQuery;
}) => {
  const currentYear = query.year ? parseInt(query.year, 10) : new Date().getFullYear();

  // 1. Calculate Total Users & Club Owners
  const [totalUsers, totalClubOwners] = await Promise.all([
    prisma.user.count({ where: { accountRole: 'USER' } }),
    prisma.user.count({ where: { accountRole: 'CLUB_OWNER' } }),
  ]);

  // 2. Calculate Total Earnings
  const paidOrders = await prisma.order.aggregate({
    where: { status: 'PAID' },
    _sum: {
      commissionAmount: true,
      serviceChargeAmount: true,
    },
  });

  const totalEarning = 
    (Number(paidOrders._sum.commissionAmount) || 0) + 
    (Number(paidOrders._sum.serviceChargeAmount) || 0);

  // 3. User Management Chart Data (Group by Month for the Given Year)
  const usersThisYear = await prisma.user.findMany({
    where: {
      accountRole: 'USER',
      createdAt: {
        gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
      },
    },
    select: { createdAt: true },
  });

  // Initialize all 12 months with 0
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { name: monthNames[i], users: 0 };
  });

  // Populate chart data
  usersThisYear.forEach((user) => {
    const monthIndex = user.createdAt.getMonth(); // 0 - 11
    chartData[monthIndex].users += 1;
  });

  return {
    totalEarning,
    totalUsers,
    totalClubOwners,
    userManagementChart: chartData,
  };
};
```

## 5. Route Registration
Location: `server/src/app/modules/admin/admin.routes.ts`

Add the following to the router:
```typescript
router
  .route('/admin/dashboard')
  .get(
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqQuery(getDashboardQuerySchema), // Optional query validation middleware
    getAdminDashboardController
  );
```

## 6. Next Steps
Once this plan is approved, the code will be integrated into the server, and the backend container will be restarted. The App/Frontend developer can then consume `/api/v1/admin/dashboard?year=2026` and directly plug the response into the UI components shown in the design.
