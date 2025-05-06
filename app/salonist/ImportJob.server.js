/**
 * Start a new import job or reuse existing in-progress one.
 * @param {Object} options
 * @param {string} options.shop
 * @param {string} options.domainId
 * @param {string} options.type - job type, e.g., 'services'
 * @param {Function} options.runJob - async function that runs the job
 * @returns {Promise<{ job: Object, isNew: boolean }>}
 */
import prisma from "../db.server";
export const startOrReuseImportJob = async({ shop, domainId, type, runJob }) => {
  const existingJob = await prisma.ImportJob.findFirst({
    where: { shop, type, status: 'in_progress' },
    orderBy: { createdAt: 'desc' },
  });

  if (existingJob) {
    return { job: existingJob, isNew: false };
  }

  const newJob = await prisma.ImportJob.create({
    data: { shop, domainId, type, status: 'in_progress' },
  });

  // Run in background
  (async () => {
    try {
      await runJob(newJob.id);
      await prisma.ImportJob.update({
        where: { id: newJob.id },
        data: { status: 'done' },
      });
    } catch (error) {
      await prisma.ImportJob.update({
        where: { id: newJob.id },
        data: { status: 'failed', error: String(error) },
      });
    }
  })();

  return { job: newJob, isNew: true };
}
