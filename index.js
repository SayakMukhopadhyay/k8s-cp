import {CoreV1Api, Cp, KubeConfig} from "@kubernetes/client-node";

const kubeConfig = new KubeConfig();
kubeConfig.loadFromDefault();

const coreV1Api = kubeConfig.makeApiClient(CoreV1Api);

const namespace = 'default';

const pod = {
    metadata: {
        generateName: 'test-pod-',
    }, spec: {
        containers: [{
            name: 'copy', image: 'busybox', command: ['/bin/sh', '-c', 'tail -f /dev/null'],
        },]
    },
};

const copyPodCreated = (await coreV1Api.createNamespacedPod(namespace, pod)).body;
let copyPodStatus = await coreV1Api.readNamespacedPodStatus(copyPodCreated.metadata.name, namespace);

while (copyPodStatus.body.status.phase !== "Running") {
    await new Promise(r => setTimeout(r, 2000));
    copyPodStatus = await coreV1Api.readNamespacedPodStatus(copyPodCreated.metadata.name, namespace);
}

const cp = new Cp(kubeConfig);

await cp.cpToPod(namespace, copyPodCreated.metadata.name, 'copy', './assets', '/home',);

console.log("Done");
