#!/usr/bin/env node
import 'source-map-support/register.js';
import * as cdk from 'aws-cdk-lib';
import { WhofoundmeStack } from '../lib/stacks/whofoundme-stack.js';
import { CertificateStack } from '../lib/stacks/certificate-stack.js';

const app = new cdk.App();

// Environment configuration
const envEuWest1: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'eu-west-1',
};

const envUsEast1: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

// Domain configuration
const domainName = 'whofound.me';

// Certificate must be in us-east-1 for CloudFront
const certificateStack = new CertificateStack(app, 'WhofoundmeCertificateStack', {
  env: envUsEast1,
  domainName,
  crossRegionReferences: true,
  description: 'whofound.me - ACM Certificate (us-east-1 for CloudFront)',
});

// Main stack in eu-west-1
const mainStack = new WhofoundmeStack(app, 'WhofoundmeStack', {
  env: envEuWest1,
  domainName,
  certificate: certificateStack.certificate,
  crossRegionReferences: true,
  description: 'whofound.me - Main infrastructure (eu-west-1)',
});

// Ensure certificate is created first
mainStack.addDependency(certificateStack);

app.synth();

