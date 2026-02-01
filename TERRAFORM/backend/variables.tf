variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-south-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "api.studzee.in"
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "studzee-backend"
}

variable "ecs_desired_count" {
  description = "Number of ECS tasks to run. Set to 0 initially, then increase after pushing image to ECR."
  type        = number
  default     = 0
}