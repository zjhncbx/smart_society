String formatAmount(double v) {
  final neg = v < 0;
  final abs = v.abs();
  final s = abs == abs.roundToDouble()
      ? abs.toStringAsFixed(0)
      : abs.toStringAsFixed(2);
  return '${neg ? '-' : ''}$s';
}
