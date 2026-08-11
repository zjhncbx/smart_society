class CustomRoleConfig {
  final Map<String, String> customLabels;

  const CustomRoleConfig({required this.customLabels});

  Map<String, dynamic> toJson() => {'customLabels': customLabels};

  factory CustomRoleConfig.fromJson(Map<String, dynamic> json) =>
      CustomRoleConfig(
        customLabels: Map<String, String>.from(
          (json['customLabels'] as Map?)?.cast<String, String>() ?? {},
        ),
      );

  String getLabel(String roleId, String defaultLabel) =>
      customLabels[roleId] ?? defaultLabel;
}
