resource "aws_vpc" "nexora" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "nexora-${var.environment}-vpc"
  })
}

resource "aws_internet_gateway" "edge" {
  vpc_id = aws_vpc.nexora.id

  tags = merge(local.common_tags, {
    Name = "nexora-${var.environment}-igw"
  })
}

resource "aws_subnet" "public" {
  for_each = var.public_subnets

  vpc_id                  = aws_vpc.nexora.id
  availability_zone       = each.value.availability_zone
  cidr_block              = each.value.cidr_block
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name    = "nexora-${var.environment}-public-${each.key}"
    Network = "public"
    Tier    = "edge"
  })
}

resource "aws_subnet" "private" {
  for_each = var.private_subnets

  vpc_id                  = aws_vpc.nexora.id
  availability_zone       = each.value.availability_zone
  cidr_block              = each.value.cidr_block
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, {
    Name    = "nexora-${var.environment}-private-${each.key}"
    Network = "private"
    Tier    = "application"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.nexora.id

  tags = merge(local.common_tags, {
    Name    = "nexora-${var.environment}-public-rt"
    Network = "public"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.edge.id
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  for_each = aws_subnet.private

  vpc_id = aws_vpc.nexora.id

  tags = merge(local.common_tags, {
    Name    = "nexora-${var.environment}-private-${each.key}-rt"
    Network = "private"
  })
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}
