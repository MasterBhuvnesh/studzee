# Route53 Hosted Zone Data Source
data "aws_route53_zone" "zone" {
  name         = "studzee.in"
  private_zone = false
}

# A Record for ALB
resource "aws_route53_record" "alb" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.alb.dns_name
    zone_id                = aws_lb.alb.zone_id
    evaluate_target_health = true
  }
}
