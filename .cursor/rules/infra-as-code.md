# Infrastructure-as-Code Rules

These rules are **hard constraints** that all agents MUST follow. No manual infrastructure changes.

## CDK Requirement

- **ALL AWS resources MUST be provisioned using AWS CDK**
- CDK stacks MUST synthesize to CloudFormation templates
- CDK code is the single source of truth for infrastructure

## Forbidden Actions

- **NO manual resource creation** via AWS Console
- **NO ad-hoc configuration changes** in AWS Console
- **NO undocumented infrastructure modifications**
- **NO resources not represented in CDK**

## Required CDK Resources

All of the following MUST be defined in CDK:
- S3 buckets
- CloudFront distributions
- API Gateway
- Lambda functions
- IAM roles and policies
- WAF rules
- ACM certificates
- Route53 records

## Configuration Management

- Environment configuration MUST be versioned in Git
- Secrets MUST be managed via AWS-native mechanisms (Secrets Manager, SSM)
- **No hardcoded secrets** in code or configuration files
- Environment-specific configs (dev/staging/prod) in separate files

## Deployment

- All deployments via `cdk deploy`
- No manual AWS Console deployments
- CI/CD pipeline handles all environment deployments

## Agent Behavior

Agents MUST refuse:
- Any instruction to "just create it in the console"
- Any resource not represented in CDK
- Any undocumented manual infrastructure change
- Hardcoded credentials or secrets

## Drift Prevention

- Regular `cdk diff` to detect drift
- Any detected drift must be resolved by updating CDK, not console

