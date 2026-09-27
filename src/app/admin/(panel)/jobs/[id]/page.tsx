import {notFound} from "next/navigation";
import {getJob, JOB_TITLES} from "@/lib/article-jobs";
import {JobView} from "@/components/admin/JobView";

export const dynamic = "force-dynamic";

const JobPage = async ({params}: {params: Promise<{id: string}>}) => {
    const job = getJob(Number((await params).id));
    if (!job) notFound();
    const {input, ...rest} = job;
    return (
        <JobView
            title={JOB_TITLES[job.kind]}
            initial={{...rest, input: {topic: input.topic, sourceUrl: input.sourceUrl}}}
        />
    );
};

export default JobPage;
