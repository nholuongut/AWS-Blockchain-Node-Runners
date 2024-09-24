import {Match, Template} from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import * as dotenv from 'dotenv';

dotenv.config({path: './test/.env-test'});
import * as config from "../lib/config/baseConfig";
import {BaseSingleNodeStack} from "../lib/single-node-stack";

describe("BaseSingleNodeStack", () => {
  let app: cdk.App;
  let baseSingleNodeStack: BaseSingleNodeStack;
  let template: Template;
  beforeAll(() => {
    app = new cdk.App();

    // Create the BaseSingleNodeStack.
    baseSingleNodeStack = new BaseSingleNodeStack(app, "base-single-node", {
      stackName: `base-single-node-${config.baseNodeConfig.baseNodeConfiguration}-${config.baseNodeConfig.baseNetworkId}`,
      env: { account: config.baseConfig.accountId, region: config.baseConfig.region },

      instanceType: config.baseNodeConfig.instanceType,
      instanceCpuType: config.baseNodeConfig.instanceCpuType,
      baseNetworkId: config.baseNodeConfig.baseNetworkId,
      baseNodeConfiguration: config.baseNodeConfig.baseNodeConfiguration,
      restoreFromSnapshot: config.baseNodeConfig.restoreFromSnapshot,
      l1ExecutionEndpoint: config.baseNodeConfig.l1ExecutionEndpoint,
      l1ConsensusEndpoint: config.baseNodeConfig.l1ConsensusEndpoint,
      snapshotUrl: config.baseNodeConfig.snapshotUrl,
      dataVolume: config.baseNodeConfig.dataVolume,
    });

    template = Template.fromStack(baseSingleNodeStack);
  });

  test("Check Security Group", () => {
    // Has EC2 instance security group.
    template.hasResourceProperties("AWS::EC2::SecurityGroup", {
      GroupDescription: Match.anyValue(),
      VpcId: Match.anyValue(),
      SecurityGroupEgress: [
        {
          "CidrIp": "0.0.0.0/0",
          "Description": "All outbound connections except 13000",
          "FromPort": 0,
          "IpProtocol": "tcp",
          "ToPort": 12999
         },
         {
          "CidrIp": "0.0.0.0/0",
          "Description": "All outbound connections except 13000",
          "FromPort": 13001,
          "IpProtocol": "tcp",
          "ToPort": 65535
         },
         {
          "CidrIp": "0.0.0.0/0",
          "Description": "All outbound connections except 13000",
          "FromPort": 0,
          "IpProtocol": "udp",
          "ToPort": 12999
         },
         {
          "CidrIp": "0.0.0.0/0",
          "Description": "All outbound connections except 13000",
          "FromPort": 13001,
          "IpProtocol": "udp",
          "ToPort": 65535
         }
      ],
      SecurityGroupIngress: [
        {
          "CidrIp": "0.0.0.0/0",
          "Description": "P2P",
          "FromPort": 9222,
          "IpProtocol": "tcp",
          "ToPort": 9222
        },
        {
          "CidrIp": "0.0.0.0/0",
          "Description": "P2P",
          "FromPort": 9222,
          "IpProtocol": "udp",
          "ToPort": 9222
        },
        {
          "CidrIp": "1.2.3.4/5",
          "Description": "Base Client RPC",
          "FromPort": 8545,
          "IpProtocol": "tcp",
          "ToPort": 8545
        }
      ]
    })
  });


  test("Check EC2 Settings", () => {
    // Has EC2 instance with node configuration
    template.hasResourceProperties("AWS::EC2::Instance", {
      AvailabilityZone: Match.anyValue(),
      UserData: Match.anyValue(),
      BlockDeviceMappings: [
        {
          DeviceName: "/dev/xvda",
          Ebs: {
            DeleteOnTermination: true,
            Encrypted: true,
            Iops: 3000,
            VolumeSize: 46,
            VolumeType: "gp3"
          }
        }
      ],
      IamInstanceProfile: Match.anyValue(),
      ImageId: Match.anyValue(),
      InstanceType: "m7g.4xlarge",
      Monitoring: true,
      PropagateTagsToVolumeOnCreation: true,
      SecurityGroupIds: Match.anyValue(),
      SubnetId: Match.anyValue(),
    });

    // // Has EBS data volume.
    template.hasResourceProperties("AWS::EC2::Volume", {
      AvailabilityZone: Match.anyValue(),
      Encrypted: true,
      Iops: 5000,
      MultiAttachEnabled: false,
      Size: 7200,
      Throughput: 700,
      VolumeType: "gp3"
    })

    // Has EBS data volume attachment.
    template.hasResourceProperties("AWS::EC2::VolumeAttachment", {
      Device: "/dev/sdf",
      InstanceId: Match.anyValue(),
      VolumeId: Match.anyValue(),
    })
  });

  test("Check CloudWatch Dashboard", () => {
    // Has CloudWatch dashboard.
    template.hasResourceProperties("AWS::CloudWatch::Dashboard", {
      DashboardBody: Match.anyValue(),
      DashboardName: {
        "Fn::Join": [
          "",
          [
           "base-single-node-full-mainnet-",
           {
            "Ref": Match.anyValue()
           }
          ]
         ]
      }
    })
  });
});
