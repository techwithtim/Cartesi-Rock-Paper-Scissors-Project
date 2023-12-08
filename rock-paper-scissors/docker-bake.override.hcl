
target "dapp" {
  # default context is "."
  # default dockerfile is "Dockerfile"
}

variable "TAG" {
  default = "devel"
}

variable "DOCKER_ORGANIZATION" {
  default = "cartesi"
}

target "server" {
  tags = ["${DOCKER_ORGANIZATION}/dapp:rock-paper-scissors-${TAG}-server"]
}

target "console" {
  tags = ["${DOCKER_ORGANIZATION}/dapp:rock-paper-scissors-${TAG}-console"]
}

target "machine" {
  tags = ["${DOCKER_ORGANIZATION}/dapp:rock-paper-scissors-${TAG}-machine"]
}
